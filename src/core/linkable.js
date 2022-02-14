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

            this.options = deepMerge( this.options, Object.getPrototypeOf(this).options );

            this.events = deepMerge( this.events, Object.getPrototypeOf(this).events );
        }
    }

    constructor( options ){
        super();
        this._options = Object.entries( this.constructor.options ).reduce((acc,[p,v])=>{
            acc[p] = options.hasOwnProperty(p) ? options[p] : deepCopy( v );
            return acc;
        },{});
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

        // Normally context id a set:
        // {
        //  data,
        //  parent,
        //  <some_source>
        //  ...
        // }
        if (context instanceof Linkable){
            context = {data: context};
        }else{
            context = {...context, self:this };
        }
        context.default = context.data || context.parent || context.self;

        // Links
        Object.entries(this._options.links).forEach(([ property, link])=>{

            // Normally link has format:
            // { source, event, handler }
            // By default the source is data
            if (typeof link === "string"){
                link = {source: context.default, event: link}
            }else if(typeof link === "object" && typeof link.event === "string"){
                if (typeof link.source === "string"){
                    // The source is defined
                    if ( !context[link.source] ){
                        // The source is not provided
                        console.warn("skip the link for not provided source", link.source);
                        link = undefined;
                    }else{
                        link.source = context[link.source];
                    }
                }else{
                    link.source = context.default;
                }
            }else{
                console.error("invalid link settings", link);
                link = undefined;
            }

            if (link){
                new Link({...link, context, target:this, property});
            }

        });

        // Events
        Object.entries( this._options.events ).forEach(([event, params])=>{
            // Normally params have format:
            // { handler, target, property }
            if (typeof params === "function"){
                // No target just handler is defined - callback
                params = {handler:params }  // No target
            }else if (typeof params === "string"){
                // Just name of the property in data item
                params = { target:context.default, property:params }
            }else if(typeof params === "object" && (params.handler || params.property)){
                if (params.property){
                    if (typeof params.target === "string"){
                        if (!context[params.target]){
                            console.warn("skip the event for not provided target", params.target);
                            params = undefined;
                        }else{
                            params.target = context[params.target];
                        }
                    }else{
                        params.target = context.default;
                    }
                }else if (params.target){
                    console.error("invalid event settings", params);
                    params = undefined;
                }
            }

            if (params){
                new Link({...params, context, source:this, event});
            }
        });

        return context;
    }

    destroy(){
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

        const setTarget = value =>{
            // The link could be destroyed while waiting for the handler
            // or the link may don't have a target
            if (this._target) this._target.set({ [property]:value });
        };

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
