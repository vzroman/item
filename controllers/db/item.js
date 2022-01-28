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

import {Controller as Item} from "../item.js";
import * as util from "../../utilities/data.js";

export class Controller extends Item{

    static options = {
        connection:undefined,
        timeout: 60000,
        subscribe:false
    };

    constructor( options ){
        super( options );

        if (typeof this._options.connection !== "function")
            throw new Error("invalid connection: " + this._options.connection);
    }
    //-------------------------------------------------------------------
    // Data access API
    //-------------------------------------------------------------------
    init( ID ){

        const defaults = this._schema.get({});

        return new Promise((resolve, reject) => {

            if ( ID===undefined ) return resolve( super.init( defaults ) );

            const filter = `.oid = $oid('${ ID }')`;

            this.query( filter ).then(data => {

                if ( data ) {
                    this._ID = ID;
                    this._filter = filter;
                }else{
                    data = defaults;
                }

                resolve( super.init( data ) );

            }, reject);
        });
    }

    rollback(changes, error){
        return new Promise((resolve, reject) => {

            if (changes) {
                resolve( super.rollback(changes, error) );
            }else{
                this.refresh().then(result =>{

                    this._trigger("rollback", error);

                    resolve( result );

                }, reject);
            }
        });
    }

    refresh( data ){
        if ( !data ){
            return new Promise((resolve, reject) => {

                if (this._filter === undefined) return reject("not initialized");

                this.query( this._filter) .then(data => {

                    super.refresh( data ).then( resolve, reject );

                }, reject);
            });
        }else{
            return super.refresh( data );
        }
    }

    query( filter ){
        return new Promise((resolve, reject) => {

            const fields = this._schema.filter({virtual:false}).join(",");

            this._options.connection().get(`get ${ fields } from * where ${ filter } format $to_json`,Items=>{

                resolve( Items[0] );

            }, reject, this._options.timeout );
        });
    }

    setSubscribe( value ){
        // TODO
    }

    commit(){
        return new Promise((resolve, reject)=>{

            if ( !this.isCommittable() ) return reject("not ready");

            if ( this._ID ){
                // the object already exits
                const changes = this._schema.filter( {virtual:false}, util.patch2value(this._changes, 0) );
                if ( !Object.keys(changes).length ){
                    // No changes in persistent fields
                    super.commit().then(resolve, reject);
                }else{
                    // Send a query to the database
                    this._options.connection().edit_object(this._ID, changes, ()=>{

                        super.commit().then(resolve, reject);

                        // Request the updated item from the database
                        this.refresh();

                    }, reject, this._options.timeout);
                }
            }else{
                // new object
                const fields = this._schema.filter( {virtual:false}, this.get() );
                this._options.connection().create_object(fields, ID=>{

                    this._ID = ID;

                    this._filter = `.oid = $oid('${ ID }')`;

                    super.commit().then(resolve, reject);

                    this.refresh();

                },reject, this._options.timeout);
            }
        });
    }

}
Controller.extend();
