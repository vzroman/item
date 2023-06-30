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

import {View as Item} from "../../item";
import {types} from "../../../types";
import {Cell} from "./cell";

export class Header extends Item{

    static options = {
        columns:{type:types.primitives.Array, required:true},
        numerated:{type:types.primitives.Bool},
        selectable:{type:types.primitives.Bool}
    };

    constructor( options ) {
        const { numerated, selectable } = options;

        options.columns = options.columns.map( col =>{
            if (typeof col === "object" && col.view!==undefined) {
                return col
            }
            if (typeof col === "string" || typeof col==="number" || typeof col === "function"){
                col = { text: col};
            }else if(typeof col!=="object"){
                throw new Error("invalid column format");
            }

            const {text,...rest} = col;
            if (typeof text === "string" || typeof text==="number") {
                return { view:Cell, options:{ text }, ...rest}
            } else if (typeof text === "function") {
                return { view:Cell, options: {
                        links:{ text:{source:"data", event:[], handler: text}}
                    }, ...rest}
            }else{
                throw new Error("invalid column format");
            }
        });

        if (numerated) options.columns = [
            { view:Cell, options: { style: {"width": "32px"} } },
            ...options.columns
        ];
        if (selectable) options.columns = [
            { view:Cell, options: { style: {"width": "32px"} } },
            ...options.columns
        ];

        super( options );
    }

    markup() {
        const $markup = $(`<tr></tr>`);
        this._options.columns.forEach(({colspan=1}, i)=> $(`<td colspan="${colspan}" name=${ i }></td>`).appendTo($markup));
        return $markup;
    }

    widgets(){
        return this._options.columns.reduce((acc, col, i)=>{
            acc[i] = col;
            return acc;
        },{});
    }
}
Header.extend();