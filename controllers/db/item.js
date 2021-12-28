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
import {patch2value} from "../../utilities/data.js";

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

        const onData = data => super.init( data || this._schema.get({}) );

        return new Promise((resolve, reject)=>{

            // New object
            if (!ID) return resolve( onData() );

            const fields = Object.keys( this._options.schema ).join(",");

            this._options.connection().query(`get ${ fields } from * where .oid = $oid('${ ID }') format $to_json`,([H,...Items])=>{
                if (Items.length === 0){
                    // The object doesn't exist yet
                    resolve( onData() );
                }else{
                    // The object exists
                    this._ID = ID;

                    let data = Items[0];
                    data = H.reduce((acc,n,i) => {
                        acc[n] = data[i];
                        return acc;
                    },{});

                    resolve( onData( data ) );
                }
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
                const changes = this._schema.filter( patch2value(this._changes, 0), {virtual:false} );
                if ( !Object.keys(changes).length ){
                    // No changes in persistent fields
                    super.commit().then(resolve, reject);
                }else{
                    // Send a query to the database
                    this._options.connection().edit_object(this._ID, changes, ()=>{
                        super.commit().then(resolve, reject);
                    }, reject, this._options.timeout);
                }
            }else{
                // new object
                const fields = this._schema.filter( this.get(), {virtual:false} );
                this._options.connection().create_object(fields, ID=>{
                    this._ID = ID;
                    super.commit().then(resolve, reject);
                },reject, this._options.timeout);
            }
        });
    }

}
Controller.extend();
