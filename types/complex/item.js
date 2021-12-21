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

import {Type as Parent} from "../primitives/any.js";
import {types} from "../index.js";
import {Controller} from "../../controllers/item.js";
import * as errors from "../../utilities/errors.js";
import {deepMerge} from "../../utilities/data.js";

export class Type extends Parent{

    // The options are described as attributes
    static options = {
        links:{type:types.primitives.Set, virtual:true, default:{} },
        events:{type:types.primitives.Set, virtual:true, default:{} }
    };

    static events = {
        destroy:types.primitives.Any
    };

    static extend(){
        super.extend();
        if (Type.isPrototypeOf( this ) ){
            // Implicitly inherit events
            this.events = deepMerge( this.events, Object.getPrototypeOf(this).events );
        }
    }

    constructor( options ){
        super( options );

        // Options are linkable to data
        this._controller = new Controller({
            schema: this.constructor.options,
        });

        this._controller.init( options );

        this._options = this._controller.get();

        if (!this._options){
            throw new errors.InvalidOptions(this.constructor, options);
        }

        // It's safe not to keep binding's id because I'll destroy
        // my controller on own destroying
        this._controller.bind("commit",changes =>{
            this._options = {...this._options, ...changes};
        });
    }

    coerce( value ){
        return this._controller.coerce( value );
    }

    get( property ){
        return this._controller.get( property );
    }

    set( properties ){
        return this._controller.set( properties );
    }

    //-------------------------------------------------------------------
    // Link to external data
    //-------------------------------------------------------------------
    link( sources ){

        // Normally sources id a set:
        // {
        //  data,
        //  parent,
        //  <some_source>
        //  ...
        // }
        if (sources instanceof Type){
            sources = {data: sources};
        }
        sources.self = this;

        // By default the source is data or parent or self
        const defaultSource = sources.data || sources.parent || sources.self;

        // Links
        Object.entries(this._options.links).forEach(([ property, link])=>{

            // Normally link has format:
            // { source, event, handler }
            // By default the source is data
            if (typeof link === "string"){
                link = {source: defaultSource, event: link}
            }else if(typeof link === "object" && typeof link.event === "string"){
                if (typeof link.source === "string"){
                    // The source is defined
                    if ( !sources[link.source] ){
                        // The source is not provided
                        console.warn("skip the link for not provided source", link.source);
                        link = undefined;
                    }else{
                        link.source = sources[link.source];
                    }
                }else{
                    link.source = defaultSource;
                }
            }else{
                console.error("invalid link settings", link);
                link = undefined;
            }

            if (link){
                new Link({...link, target:this, property});
            }

        });

        // Events
        Object.entries( this.options.events ).forEach(([event, params])=>{
            // Normally params have format:
            // { handler, target, property }
            if (typeof params === "function"){
                // No target just handler is defined - callback
                params = {handler:params }  // No target
            }else if (typeof params === "string"){
                // Just name of the property in data item
                params = { target:defaultSource, property:params }
            }else if(typeof params === "object" && (params.handler || params.property)){
                if (params.property){
                    if (typeof params.target === "string"){
                        if (!sources[params.target]){
                            console.warn("skip the event for not provided target", params.target);
                            params = undefined;
                        }else{
                            params.target = sources[params.target];
                        }
                    }else{
                        params.target = defaultSource;
                    }
                }else if (params.target){
                    console.error("invalid event settings", params);
                    params = undefined;
                }
            }

            if (params){
                new Link({...params, source:this, event});
            }
        });

        this._controller.link( sources );

        return sources;
    }

    //-------------------------------------------------------------------
    // Events API
    //-------------------------------------------------------------------
    bind(event, callback){
        if (this.constructor.events[event]){
            // Subscriptions to events overlap subscriptions to properties
            return [event, this._bind(event, callback)];
        } else{
            // Subscriptions to property changes
            return [event, this._controller.bind(event, callback)];
        }
    }

    unbind( [event,id] ){
        if (this.constructor.events[event]){
            this._unbind( id );
        } else{
            this._controller.unbind( id );
        }
    }

    _bind(type, callback){

        if (typeof callback!=="function") { throw new Error("invalid callback") }

        this.__events=this.__events||{
            id:0,
            callbacks:{},
            index:{}
        };

        // Unique id for the handler. The is an increment
        // it makes possible to run callbacks in the same order
        // they subscribed
        const id=this.__events.id++;

        this.__events.index[id]=type;
        this.__events.callbacks[type]={...this.__events[type],...{[id]:callback}};

        return id;
    }

    _unbind(id){
        const type=this.__events?this.__events.index[id]:undefined;
        if (type){
            delete this.__events.index[id];
            delete this.__events.callbacks[type][id];
        }
    }

    _trigger(type, params) {
        const callbacks=this.__events?this.__events.callbacks[type]:undefined;

        if (callbacks){
            if (!Array.isArray(params)){
                params = [params];
            }
            Object.keys(callbacks).map(k=> +k).sort().forEach(id=>{
                try{
                    callbacks[id].apply(this, params);
                }catch(e){
                    console.error("invalid event callback",e.stack);
                }
            });
        }
    }

    destroy(){
        this._trigger("destroy");
        this.__events = undefined;
        this._controller.destroy();
        this._controller = undefined;
        super.destroy();
    }
}
Type.extend();


//-------------------------------------------------------------------
// Self-destroying link
//-------------------------------------------------------------------
class Link{
    constructor({source, event, handler, target, property}){
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

        // The subscription
        this._sourceSubscriptions.push( source.bind(event, async value=>{

            // Handler can be asynchronous
            value = await handler(value);

            // The link could be destroyed while waiting for the handler
            // or the link may don't have a target
            if (this._target){
                this._target.set({ [property]:value });
            }
        }));

    }

    destroy(){
        this._sourceSubscriptions.forEach( id =>{
            this._source.unbind( id );
        });
        this._targetSubscriptions.forEach( id =>{
            this._target.unbind( id );
        });

        this._sourceSubscriptions = undefined;
        this._targetSubscriptions = undefined;

        this._source = undefined;
        this._target = undefined;

    }
}