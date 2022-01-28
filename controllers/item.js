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
        committable:true,
        commit:true,
        rollback:true
    };

    constructor( options ){
        super( options );

        if (typeof this._options.schema !== "object")
            throw new Error("invalid schema: " + this._options.schema);

        // Initialize the schema
        this._schema = new Schema( this._options.schema );

        this._changes = undefined;
        this._isValid = false;
        this._isRefresh = false;
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
        if ( this._data ){
            return super.set( properties );
        }else{
            // The controller is not initialized yet
            return undefined;
        }

    }

    _set( properties ){
        return this._schema.set( properties );
    }

    _update( changes ){

        // Add new changes
        this._merge( changes );

        this._isValid = this._validate();

        this._trigger("committable", this.isCommittable());

        if (this._options.autoCommit && !this._isRefresh && this.isCommittable()){
            // The data is ready to be committed and the controller is autoCommit
            this.commit();
        }
    }

    _merge( changes ){
        this._changes = util.patchMerge( this._changes, changes );
    }

    _validate(){
        return !!this.get();
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
        const changes = super.set( this._schema.get(Data) );
        this._data = util.patch(this._data, changes);
        this._changes = undefined;
    }

    commit(){
        return new Promise((resolve, reject)=>{

            if ( !this.isCommittable() ) return reject("not ready");

            const changes = this._changes;
            this._data = util.patch(this._data, changes);
            this._changes = undefined;

            this._trigger("commit", changes);
            this._trigger("committable", this.isCommittable() );

            resolve( changes );
        });
    }


    rollback( changes, error ){

        changes = changes || this._changes;

        // No changes to rollback
        if ( !changes ){ return }

        const rollback = util.diff( util.patch2value(changes,0), util.patch2value(changes,1) );

        this._changes = util.patchMerge(this._changes, rollback);

        this._onChange( rollback );

        this._trigger("rollback", error );

        this._trigger("committable", this.isCommittable() );
    }

    refresh( data ) {
        if ( !data ) {
            return this.refresh( util.patch2value(this._changes,0) );
        }else{
            return new Promise((resolve, reject)=>{
                this._isRefresh = true;
                this._refresh( data )
                    .then(result => {

                        // No active changes after refresh
                        if (this._changes){
                            this._data = util.patch(this._data, this._changes);
                            this._changes = undefined;
                        }

                        this._trigger("committable", this.isCommittable() );

                        resolve(result);

                    }, reject)
                    .finally(()=> this._isRefresh = false);
            });
        }
    }

    _refresh( data ){
        return new Promise(resolve => {
            resolve( this.set( data ) );
        });
    }

    isCommittable(){
        // 1. the controller is initialized
        // 2. the controller has changes
        // 3. the data is valid
        return !!(this._data && this._changes && this._isValid);
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
