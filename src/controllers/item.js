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
import * as util from "../utilities/data.js";
import {Schema} from "../core/schema.js";

export class Controller extends Linkable{

    static options = {
        schema: undefined,
        autoCommit:true,
        data:undefined,
        request:false
    };

    static events = {
        committable:true,
        commit:true,
        rollback:true,
        reject:true
    };

    constructor( options ){
        super( options );

        if (typeof this._options.schema !== "object")
            throw new Error("invalid schema: " + this._options.schema);

        // Initialize the schema
        this._schema = new Schema( this._options.schema );
        this._schema.bind("update",()=>{ 
            this._isValid = this._validate();
            //this._trigger("committable", this.isCommittable());
            this._trigger("committable", this.isCommittable());
        });

        this._data = undefined;
        this._changes = undefined;

        this._isValid = false;
        this._isRefresh = false;
        this._waitReady = [];

        if (this._options.data){
            this.init( this._options.data )
        }
    }

    get( property ){
        if ( !property ){
            return this._schema.get( super.get( Object.keys(this._options.schema) ) );
        }else{
            return super.get( property )
        }
    }

    _get( property ){
        if (typeof property === "string" && property.startsWith("$.")) {
            return this.option( property.slice(2) );
        } else if (this._changes && this._changes[property]){
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

    option( option, value ){
        if ( typeof option === "string" && value === undefined ){
            return this._options[option];
        }

        const prevValue = this._options[option];

        this._options[option] = value;
        this._trigger("$."+option, [value, prevValue]);
    }

    _set( properties ){
        properties = this._set_options( properties );
        return this._schema.set( properties );
    }

    _set_options( options ) {
        Object.entries( options ).forEach(([key, value]) => {
            if (key.startsWith("$.")) {
                this.option( key.slice(2), value );
                delete options[key];
            }
        })
        return options;
    }

    _update( changes ){

        // Add new changes
        this._merge( changes );

        const isRefresh = this._isRefresh;

        setTimeout(()=>{
            // We need to wrap the staff into setTimeout to give the schema links time to settle down
            if(this._schema === undefined) return
            this._isValid = this._validate();

            if (!isRefresh){

                this._trigger("committable", this.isCommittable());

                if (this._options.autoCommit && this.isCommittable()){
                    // The data is ready to be committed and the controller is autoCommit
                    this.commit();
                }
            }
        });
    }

    _merge( changes ){
        this._changes = util.patchMerge( this._changes, changes );
    }

    _validate(){
        return !!this.get();
    }

    link( sources ){
        super.link( sources );
        this._schema.link( sources );
    }

    //------------------------------------------------------------------
    // Bind controller properties only when it's ready
    //------------------------------------------------------------------
    bind(event, callback){

        if ( this._data || (typeof event === "string" && event.startsWith("$.")) || this.constructor.events[event] ){
            return [ super.bind( event, callback ) ]
        }

        const id = [null];
        this.onReady().then(()=>{
            if (id[0]===null){
                id[0] = super.bind( event, callback );
            }
        })
        return id;
    }

    unbind(id) {
        if (id[0]){
            super.unbind(id[0]);
        }
        id.pop();
    }

    //-------------------------------------------------------------------
    // Data access API
    //-------------------------------------------------------------------
    init( Data ){
        this._isRefresh = true;
        try {
            const changes = super.set( this._schema.coerce( Data ) );
            this._data = util.patch(this._data, changes);
            this._changes = undefined;
            this._schema.link({data:this});
            this._onReady();
        }finally {
            this._isRefresh = false;
        }
    }

    onReady(){
        return new Promise((resolve)=>{
            if (this._data) return resolve();
            this._waitReady.push( resolve );
        });
    }

    _onReady(){
        for (const callback of this._waitReady){
            try {
                callback()
            }catch(e){
                console.error("onReady callback error", e)
            }
        }
        this._waitReady=[];
    }

    commit(){
        return this._promise("commit",(resolve, reject)=>{

            if ( !this.isCommittable() ) {
                this._trigger("reject", "not ready");
                return reject("not ready");
            }

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
            if (this._changes){
                data = util.patch2value(this._changes,0);
                return this.refresh( data );
            }else{
                return this._promise("refresh", resolve => resolve());
            }
        }else{
            return this._promise("refresh",(resolve, reject)=>{

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

    queueRequest( requestFunction ){

        if (this.isDestroyed()) return;

        // The request is already active, queue the next
        const activeRequest = this._options.request;
        if (activeRequest){
            return activeRequest.finally(()=>{
                this.queueRequest( requestFunction);
            })
        }

        const request = requestFunction();
        this.option("request", request);
        request.finally(()=>{
            if (this.isDestroyed()) return;
            this.option("request", null);
        });

        return request;

    }

    _promise( action, fun ){
        return new Promise((resolve, reject)=>{
            fun( resolve, error => {
                this._trigger("error", [error, action]);
                reject( error )
            })
        });
    }

    //-------------------------------------------------------------------
    // Clean UP
    //-------------------------------------------------------------------
    _destroy(){
        this._schema?.destroy();
        this._schema = undefined;
        this._data = undefined;
        this._changes = undefined;
        super._destroy();
    }
}
Controller.extend();
