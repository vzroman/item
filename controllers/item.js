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

import {types} from "../types/index.js";
import {Attribute} from "./schema.js";
import * as util from "../utilities/data.js";
import {Schema} from "./schema.js";

export class Controller extends types.complex.Item{

    static options = {
        schema:{type:types.complex.Set, options:{ schema:Attribute.options }, required:true },
        autoCommit:{type:types.primitives.Bool, default:true }
    };

    static events = {
        init:types.primitives.Any,
        beforeChange:types.primitives.Any,
        change:types.primitives.Any,
        commit:types.primitives.Any,
    };

    constructor( options ){
        super( options );

        // Initialize the schema
        this._schema = new Schema( this._options.schema );

        this._data = undefined;
        this._changes = undefined;

        this._controller.bind("autoCommit", value =>{
            if (value){  this.commit(); }
        });

        // TODO. Do we need to subscribe to schema changes?
    }


    coerce( value ){
        return this._schema.coerce( value );
    }

    link( sources ){
        sources = super.link( sources );
        this._schema.link({...sources, parent:this});
        return sources;
    }


    bind(event, callback){

        if (this.constructor.events[event] || this._options.schema[event]){
            /// Unlike other types Controller subscribes
            // to the controlled item changes but not to it's own
            return this._bind(event, callback);

        } else{
            console.warn("invalid event to bind", event);
            return undefined;
        }
    }

    unbind( id ){
        // Unbind item changes
        this._unbind( id );
    }

    //-------------------------------------------------------------------
    // Data access API
    //-------------------------------------------------------------------
    init( Data ){
        this._set( Data );
        this._data = util.patch(this._data, this._changes);
        this._changes = undefined;
        this._trigger("init");
    }

    get( property ){

        let value = this._get( property );
        // A single property is requested
        if ( typeof property === "string" || Array.isArray( property ) ){
            return value;
        }else{

            // The whole data is requested.
            // The controller returns it only if it is validated against the schema
            return this._schema.get( value );
        }
    }
    
    _get( property ){
        if (typeof property === "string"){
            if (this._changes && this._changes[property]){
                return util.deepCopy( this._changes[property][0] );
            }else if (this._data){
                return util.deepCopy( this._data[property] );
            }
            return undefined;
        }else if(Array.isArray(property)){
            return property.reduce((acc,p)=>{
                acc[p]=this._get(p);
                return acc;
            },{});
        }
        else{
            return util.deepCopy( util.patch(this._data, this._changes) );
        }
    }

    set( properties ){
        const changes = this._set( properties );
        return new Promise((resolve, reject)=>{
            if (this._options.autoCommit && this.get()){
                // The data is ready to be committed and the controller is autoCommit
                this.commit().then(()=>{
                    resolve( changes )
                }, error=>{
                    // The commit failed, redo last changes
                    this._set( util.patch2value(changes,1) );
                    reject( error );
                });
            }else{
                resolve( changes );
            }
        });
    }

    _set( properties ){

        // Validate & parse values
        properties = this._schema.set( properties );

        // ATTENTION! The properties are passed by reference,
        // the event's callbacks are able to change values
        this._trigger( "beforeChange", properties );
        // TODO. Do we need to validate the properties after executing the callbacks?

        // Calculated the changes for the actual version of the data
        const changes = util.diff( this._get( Object.keys( properties ) ), properties );

        // No real changes - no triggering events, no commit
        if ( !changes ){ return }

        // Add new changes
        this._changes = util.patchMerge( this._changes, changes );

        // Trigger events related to item properties.
        Object.entries( changes ).forEach(([prop, change])=>{
            this._trigger(prop, change);
        });
        
        this._trigger("change", changes );

        return changes;
    }

    commit(){
        return new Promise((resolve, reject)=>{
            if ( !this._changes ){
                resolve();
            }else{
                if (!this.get()){
                    // The data is inconsistent
                    reject("inconsistent data");
                }
                this._commit().then(()=>{
                    this._data = util.patch(this._data, this._changes);
                    const changes = util.patch2value(this._changes, 0);
                    this._changes = undefined;

                    this._trigger("commit",changes);

                    resolve();
                }, reject);
            }
        });
    }

    _commit(){
        // To be overridden
        return new Promise(resolve => resolve());
    }

    //-------------------------------------------------------------------
    // Clean UP
    //-------------------------------------------------------------------
    destroy(){
        this._schema.destroy();
        this._schema = undefined;
        this._data = undefined;
        this._changes = undefined;
        super.destroy();
    }
}
Controller.extend();
