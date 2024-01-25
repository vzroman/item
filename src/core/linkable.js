//------------------------------------------------------------------------------------
// MIT License
//
// Copyright (c) 2021 vzroman
// Author: Vozzhenikov Roman, vzroman@gmail.com
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
//     The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
//     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//------------------------------------------------------------------------------------
import {Eventful} from "./eventful.js";
import {deepMerge, deepCopy, diff, patch2value, pathEval} from "../utilities/data.js";

export class Linkable extends Eventful{

    // The options are described as attributes
    static options = {
        links:{},
        events:{}
    };

    static links = { };

    static events = {
        beforeChange:true,
        change:true,
        destroy:true
    };

    static extend(){
        if (Linkable.isPrototypeOf( this ) ){

            this.options = deepMerge( Object.getPrototypeOf(this).options, this.options );

            this.links = deepMerge( Object.getPrototypeOf(this).links, this.links );

            this.events = deepMerge( Object.getPrototypeOf(this).events, this.events );
        }
    }

    constructor( options ){
        super();
        this._options = Object.entries( this.constructor.options ).reduce((acc,[p,v])=>{
            acc[p] = options.hasOwnProperty(p) ? options[p] : deepCopy( v );
            return acc;
        },{});

        this._linked = {
            properties:{},
            events:{}
        };
    }

    bind(event, callback){

        let id = undefined;

        if (Array.isArray(event)){
            //-----------Bind to a list of properties-----------------------------
            let data;
            if (event.length){
                data = this.get( event );
                id = super.bind("change", (changes,...args) => {
                    let changed = false;
                    for (const e of event){
                        if (changes[e]){
                            data[e] = deepCopy( changes[e][0] );
                            changed = true;
                        }
                    }
                    if (changed){
                        callback.apply(this, [data,...args]);
                    }
                });
            }else{
                //Empty list means all properties
                data = this.get();
                id = super.bind("change", (changes,...args) => {
                    data = {
                        ...data,
                        ...deepCopy( patch2value(changes, 0) )
                    };
                    callback.apply(this, [data,...args]);
                });
            }

            callback.apply(this, [data,this]);

        }else if(typeof event === "string"){
            // Bind to an event or a single property
            id = super.bind( event, callback );

            if (!this.constructor.events[event]){
                // The first event with actual value
                callback.apply(this, [this.get( event ), undefined, this])
            }
        }

        return id;
    }

    get( property ){
        if (typeof property === "string"){
            // single property
            return this._get( property );
        }else if( Array.isArray(property) ){
            // list of properties
            return property.reduce((acc,p)=>{
                acc[p] = this._get(p);
                return acc;
            },{});
        }else{
            // all properties
            return this.get( Object.keys( this._options ) );
        }
    }

    _get( property ){
        return deepCopy( this._options[ property ] );
    }

    set( properties ){

        if (typeof properties !== "object" || properties.constructor !== Object){ return }

        properties = this._set( deepCopy(properties) );

        // ATTENTION! The properties are passed by reference,
        // the event's callbacks are able to change values
        this._trigger( "beforeChange", properties );

        const changes = diff( this.get(Object.keys( properties )), properties );

        // No real changes - no triggering events
        if ( !changes ){ return }

        this._update( changes );

        this._onChange( changes );

        return changes;

    }

    _set( properties ){
        const result = {};
        for (const p in properties){
            if ( !this.constructor.options.hasOwnProperty(p) ){
                continue
            }
            if( properties[p] === undefined ){
                result[ p ] = this.constructor.options[ p ];
            }else{
                result[ p ] = properties[ p ];
            }
        }
        return result;
    }

    _update( changes ){
        this._options = {
            ...this._options,
            ...deepCopy( patch2value(changes, 0) )
        };
    }

    _onChange( changes ){

        this._trigger("change", changes);

        // Trigger events related to item properties.
        Object.entries( changes ).forEach(([prop, change])=>{
            this._trigger(prop, change);
        });
    }

    //-------------------------------------------------------------------
    // Link to external items
    //-------------------------------------------------------------------
    link( context ){

        context = this.linkContext( context );

        //------------------------Links---------------------------------------
        this.initLinks( context );

        //------------------------Events--------------------------------------------
        this.initEvents( context );
    }

    linkContext( context ){

        if (context instanceof Linkable){
            context = { data:context };
        }else if (!(context instanceof Object)){
            context = {};
        }

        return {...context, self:this};
    }

    initLinks( context ){

        const links = {...this.constructor.links, ...this._options.links};

        for (let [property,link] of Object.entries( links )){

            // A link cannot be activated twice, skip it if it is already active
            if (this._linked.properties[property]) continue;

            // The complete format of a link:
            // { source, event, handler }
            if (typeof link === "string"){
                link = { source:link }
            }

            if (!(link instanceof Object)){
                console.error("invalid link settings", link);
                continue;
            }

            if (!link.source){
                console.error("link source is not defined", link);
                continue;
            }
            let {source, event, handler} = link;
            if (!event){
                [source, event] = link.source.split("@");
                if (!event){
                    event = source;
                    source = "data";
                }
            }

            if (typeof event==="string" && event.startsWith("[")){
                try{
                    event = JSON.parse(event)
                }catch(e){
                    console.error("invalid event", link);
                    continue;
                }
            }

            source = source instanceof Linkable
                ? source
                : pathEval(source, context);

            if ( source ){
                // The context contains the source controller, the link runs
                this._linked.properties[property] = new Link({
                    source,
                    event,
                    context,
                    handler,
                    target:this,
                    property
                });
            }
        }

    }

    initEvents( context ){

        const events = {...this.constructor.events, ...this._options.events};

        for (let [event, params] of Object.entries( events )){

            // An event cannot be activated twice, skip it if it is already active
            if (this._linked.events[event]) continue;

            // Normally params have format:
            // { handler, target }
            if (typeof params === "function") {
                // No target just handler is defined - callback
                params = {handler: params};  // No target
            }

            if ( typeof params === "string" ){
                // No handler is defined, just target
                params = { target:params }
            }

            if (typeof params !== "object") continue;

            if ( params.target && params.target.split("@").length === 1){
                // By default, the target controller is data
                params.target = "data@" + params.target;
            }

            const [target, property] = params.target ? params.target.split("@") : [];

            // If the target is not defined then the event has only a handler
            // and does not depend on the context
            if ( !target || pathEval(target, context)){

                this._linked.events[ event ] = new Link({
                    source:this,
                    event,
                    context,
                    handler:params.handler,
                    target: pathEval(target, context),
                    property
                });
            }
        }
    }

    _destroy(){

        if (this._linked){
            for (const link of Object.values(this._linked.properties)){
                link.destroy();
            }
            for (const link of Object.values(this._linked.events)){
                link.destroy();
            }
            this._linked = undefined;
        }

        this._options = undefined;
        super._destroy();
    }
}


//-------------------------------------------------------------------
// Self-destroying link
//-------------------------------------------------------------------
class Link{
    constructor({source, event, context, handler, target, property}){
        this._source = source;
        this._sourceSubscriptions = [];

        this._target = target;
        this._targetSubscriptions = [];

        // Default handler
        handler = handler || (v=>v);

        let setTarget = () => {};
        if ( this._target ){
            if ( property.startsWith("!") && typeof this._target[property.slice(1)] === "function" ){
                const method = property.slice(1);
                setTarget = value => {

                    // The link could be destroyed while waiting for the handler
                    // or the link may don't have a target
                    if ( !this._target ) return;

                    if ( !Array.isArray( value ) ){
                        value = [value];
                    }
                    this._target[method].apply(this._target, value);
                }
            }else{
                setTarget = value => {
                    // The link could be destroyed while waiting for the handler
                    // or the link may don't have a target
                    if ( !this._target ) return;

                    this._target.set({ [property]:value });
                }
            }
        }

        // The subscription
        this._sourceSubscriptions.push( source.bind(event, (...args) => {

            // Handler can be asynchronous
            const value = handler.apply(this, [...args, context]);

            if (value instanceof Promise){
                value.then( setTarget )
            }else{
                setTarget( value )
            }
        }));

        // Self-destruction
        this._sourceSubscriptions.push( this._source.bind("destroy",() => this.destroy()) );
        if (this._target){
            this._targetSubscriptions.push( this._target.bind("destroy",() => this.destroy()) );
        }
    }

    destroy(){
        if (this._sourceSubscriptions){
            this._sourceSubscriptions.forEach( id =>{
                this._source.unbind( id );
            });
        }

        if (this._targetSubscriptions){
            this._targetSubscriptions.forEach( id =>{
                this._target.unbind( id );
            });
        }

        this._sourceSubscriptions = undefined;
        this._targetSubscriptions = undefined;

        this._source = undefined;
        this._target = undefined;

    }
}
