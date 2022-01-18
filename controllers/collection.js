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
import {Controller as Item} from "./item.js";
import {Linkable} from "../core/linkable.js";
import * as util from "../utilities/data.js";
import {Eventful} from "../core/eventful.js";

export class Controller extends Item{

    static options = {
        filter:undefined,
        orderBy:undefined,
        page:undefined
    };

    static events = {
        add:true,
        edit:true,
        remove:true
    };

    get( id ){
        if ( !id ){
            return this.get( Object.keys({...this._data, ...this._changes}) );
        } else {
            return Linkable.prototype.get.call(this, id);
        }
    }

    _get( id ){
        if ( this._data ){

            // Get the item by its ID
            let item = this._data[ id ];

            // If item has uncommitted changes
            if ( this._changes && this._changes[ id ]){
                if ( this._changes[ id ][ 0 ]){
                    // Item was changed or created
                    item = {...item, ...this._changes[ id ][ 0 ]}
                }else{
                    // Item was deleted
                    item = undefined;
                }
            }

            // Make a copy of the item
            if ( item ){
                item = util.deepCopy( this._schema.get( item ) );
            }

            return item;
        }else{
            // The controller is not initialized yet
            return undefined;
        }

    }

    _set( items ){
        for (const id in items){
            // Validate the item against the schema
            items[ id ] = this._schema.set( items[id] );

            // Check for real changes
            const changes = util.diff( this.get( id ), items[ id ] );
            if (!changes){
                delete items[ id ];
            }else{
                // Keep changes only
                items[ id ] = util.patch2value( items[ id ], 0 );
            }
        }
        return items;
    }



    _merge( changes ){
        for (const id in changes){
            const patch = util.patchMerge( this._changes[ id ], changes[ id ] );
            if ( patch ){
                this._changes[ id ] = patch;
            }else{
                delete this._changes[ id ];
            }
        }
    }

    _validate(){
        let isValid = true;
        for (const id in this._changes){
            if ( this._changes[ id ][0] && !this.get( id ) ){
                isValid = false;
                break;
            }
        }
        return isValid;
    }


    bind(event, callback){
        if ( this.constructor.events[event] ){
            return super.bind( event, callback );
        } else {
            // Unlike other types Controller subscribes
            // to the controlled item changes but not to it's own
            const id = Eventful.prototype.bind.call(this, event, callback);

            // The first event with actual value
            this._trigger(event, [this.get(event), undefined]);

            return id;
        }
    }

}
Controller.extend();
