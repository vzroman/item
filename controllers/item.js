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
import {Linkable} from "../core/linkable.js";
import {Eventful} from "../core/eventful.js";
import * as util from "../utilities/data.js";
import {Schema} from "../core/schema.js";

export class Controller extends Linkable{

    static options = {
        schema: undefined,
        autoCommit:true
    };

    static events = {
        init:true,
        commit:true,
        rollback:true
    };

    constructor( options ){
        super( options );

        if (typeof this._options.schema !== "object")
            throw new Error("invalid schema: " + this._options.schema);

        // Initialize the schema
        this._schema = new Schema( this._options.schema );

        this._data = undefined;
        this._changes = undefined;
    }

    get( property ){
        if ( !property ){
            return this._schema.get( super.get( Object.keys(this._options.schema) ) );
        }else{
            return super.get( property )
        }
    }

    _get( property ){
        if (this._changes && this._changes[property]){
            return util.deepCopy( this._changes[property][0] );
        }else if (this._data){
            return util.deepCopy( this._data[property] );
        }else{
            return undefined;
        }
    }

    set( properties ){

        properties = this._schema.set( properties );

        const changes = this._set( properties );

        if (!changes) return;

        // Add new changes
        this._changes = util.patchMerge( this._changes, changes );

        return new Promise((resolve, reject)=>{
            if (this._options.autoCommit && this.isCommittable()){
                // The data is ready to be committed and the controller is autoCommit
                this.commit().then(()=>{

                    this._trigger("commit",changes);

                    resolve( changes );
                }, error=>{

                    // The commit failed, redo the last changes
                    this._changes = util.patchMerge(this._changes, this._set( util.patch2value(changes,1)));

                    this._trigger("rollback",error);

                    reject( error );
                });
            }else{
                resolve( changes );
            }
        });
    }


    link( sources ){
        sources = super.link( sources );
        this._schema.link({...sources, parent:this});
        return sources;
    }


    bind(event, callback){
        if ( this.constructor.events[event] ){
            return super.bind( event, callback );
        } else if( this._options.schema[event] ){
            // Unlike other types Controller subscribes
            // to the controlled item changes but not to it's own
            const id = Eventful.prototype.bind.call(this, event, callback);

            // The first event with actual value
            this._trigger(event, [this.get(event), undefined]);

            return id;
        }else{
            console.warn("invalid event to bind", event);
            return undefined;
        }
    }

    //-------------------------------------------------------------------
    // Data access API
    //-------------------------------------------------------------------
    init( Data ){
        const changes = this._set( this._schema.set( Data ) );
        this._data = util.patch(this._data, changes);
        this._changes = undefined;
        this._trigger("init");
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
                    this._changes = undefined;
                    resolve();
                }, reject);
            }
        });
    }

    rollback(){
        if ( !this._changes ) return;

        this._set( util.patch2value(this._changes, 1));

        this._changes = undefined;
    }

    isCommittable(){
        return !!(this._changes && this.get());
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
