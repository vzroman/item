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
import {Type as Parent} from "../types/type.js";
import {deepCopy} from "../utilities/data.js";

export class Schema{

    constructor( Attributes ){

        this._attributes = Object.entries( Attributes ).reduce((acc,[p, options])=>{
            acc[p] = new Attribute( options );
            return acc;
        },{});

    }

    get( properties ){

        // Return only properties that are defined in the schema
        let result = {};
        for (let p in this._attributes){

            // TODO. Virtual fields are not returned, because they cannot be committed and saved?
            if (this._attributes[p].virtual ){ continue }

            result[ p ] = this._attributes[ p ].coerce( properties[p] );

            // If one of the required properties is not defined then the whole result
            // is undefined
            if ( result[ p ] === undefined && this._attributes[ p ].isRequired() ){
                result = undefined;
                break;
            }
        }

        return result;
    }

    set( properties ){

        for (const p in properties){

            // Remove the property if it is not in the schema
            if (!this._attributes.hasOwnProperty( p )){
                delete properties[ p ];
                continue;
            }

            properties[p] = this._attributes[p].coerce( properties[p] );
        }

        return properties;
    }

    validate( properties ){
        return this.get( this.set( properties ) );
    }

    destroy(){
        if (!this._schema){ return; }

        Object.values( this._schema ).forEach( t=> t.destroy() );

        this._schema = undefined;
    }
}

export class Attribute extends Parent{

    static options = {
        type:{type:Parent, required:true, default: types.primitives.Any},
        required:{type:types.primitives.Any},
        default:{type:types.primitives.Any},
        virtual:{type:types.primitives.Bool, default:false }
    };

    constructor( options ){
        // We extracted our own options
        super( options );

        // Types has a static schema, they extract only their own options
        this._type = new this._options.type( options );

        // validate the default value
        this._options.default = this._type.coerce( this._options.default );

        this.virtual = this._options.virtual;

        this.isRequired = typeof this._options.required === "function"
            ? this._options.required
            : () => !!this._options.required
    }

    coerce( value ){
        // Type validation
        value  = this._type.coerce( value );

        if (
            (value === null || value === undefined)
            && this._options.default !== null
            && this._options.default !== undefined
        ){
            return deepCopy( this._options.default )
        } else {
            return value;
        }
    }
}