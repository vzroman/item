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
import {deepMerge,deepCopy,diff,patch2value} from "../utilities/data.js";

export class Linkable extends Eventful{

    // The options are described as attributes
    static options = {
        links:{},
        events:{}
    };

    static events = {
        beforeChange:true,
        change:true,
        destroy:true
    };

    static extend(){
        if (Linkable.isPrototypeOf( this ) ){

            this.options = deepMerge( Object.getPrototypeOf(this).options, this.options );

            this.events = deepMerge( Object.getPrototypeOf(this).events, this.events );
        }
    }

    constructor( options ){
        super();
        this._options = Object.entries( this.constructor.options ).reduce((acc,[p,v])=>{
            acc[p] = options.hasOwnProperty(p) ? options[p] : deepCopy( v );
            return acc;
        },{});

        // Run links but after descendants finish their initialization procedures.
        // We don't pass any data so only self links are initialized
        this._linked = {
            properties:{},
            events:{}
        };
        setTimeout(() =>this.link());
    }

    bind(event, callback){
        if (this.constructor.events[event]){
            return super.bind( event, callback );
        }else if( this.constructor.options[event] ){
            const id = super.bind( event, callback );

            // The first event with actual value
            this._trigger(event, [this._options[event], undefined]);

            return id;
        }else{
            console.warn("invalid event", event);
            return undefined;
        }
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

        // Links can be either against data or against self/parent
        // items. self/parent links are run in the constructor. Links to
        // data can be run externally.
        if ( !context ){
            context = { self:this }
        }else if (context instanceof Linkable){
            context = { data:context };
        }

        //------------------------Links---------------------------------------
        for (let [property,link] of Object.entries(this._options.links)){

            // A link cannot be activated twice, skip it if it is already active
            if (this._linked.properties[property]) continue;

            // Normally a link has a format:
            // { source, handler }
            // source has a format controller@property
            // By default the source controller is data, therefore
            // link without a controller is the same as a link with data@ prefix
            if (typeof link === "string"){
                // The case when a handler is not defined
                link = { source:link }
            }
            if ( link.source.split("@").length === 1){
                // The source controller is not defined, be default it is data
                link.source = "data@" + link.source;
            }

            if (!link.source){
                console.error("invalid link settings", link);
            }

            let [source, event] = link.source.split("@");
            source = context[source];

            if ( source ){
                // The context contains the source controller, the link runs
                this._linked.properties[property] = new Link({
                    source,
                    event,
                    context,
                    handler:link.handler,
                    target:this,
                    property
                });
            }
        }


        //------------------------Events--------------------------------------------
        for (let [event, params] of Object.entries(this._options.events)){

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

            if ( params.target && params.target.split("@").length === 1){
                // By default, the target controller is data
                params.target = "data@" + params.target;
            }

            const [target, property] = params.target ? params.target.split("@") : [];

            // If the target is not defined then the event has only a handler
            // and does not depend on the context
            if ( !target || context[target]){

                this._linked.events[ event ] = new Link({
                    source:this,
                    event,
                    context,
                    handler:params.handler,
                    target: target ? context[target] : undefined,
                    property
                });
            }
        }
    }

    destroy(){
        for (const link of Object.values(this._linked.properties)){
            link.destroy();
        }
        for (const link of Object.values(this._linked.events)){
            link.destroy();
        }
        this._linked = undefined;

        this._trigger("destroy");
        this._options = undefined;
        super.destroy();
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

        // Self-destruction
        this._sourceSubscriptions.push( this._source.bind("destroy",() => this.destroy()) );
        if (this._target){
            this._targetSubscriptions.push( this._target.bind("destroy",() => this.destroy()) );
        }

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
