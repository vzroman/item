//------------------------------------------------------------------------------------
// MIT License
//
// Copyright (c) 2023 vzroman
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

import {View as Collection} from "../collection.js";
import {View as Item} from "../item.js";
import {types} from "../../types/index.js";
import style from "./grid.css";

class Header extends Item{

}
Header.extend();

class Footer extends Item{

}
Footer.extend();

class Pager extends Item{

}
Pager.extend();

export class View extends Collection{

    static options = {
        columns:{ type:types.primitives.Array, required:true },    // string | { fields, handler } | Item }
        header:{ type:types.primitives.Array },                    // string | Item | function -> string | $markup
        footer:{ type:types.primitives.Array },
        resizable:{ type:types.primitives.Bool },
        pager:{ type:types.primitives.Set }
    };

    constructor( options ) {
        options.columns = options.columns.map( col =>{
            if (typeof col === "string"){
                return { view:Cell, options:{
                    links:{ text: {source:"data", event:col} }
                }}
            }else if(typeof col === "object" && col.handler ){
                const {handler, fields=[]} = col;
                return { view:Cell, options: {
                    links:{ text:{source:"data", event:fields, handler}}
                }}
            }else{
                return col
            }
        });
        super( options );
    }

    widgets(){
        const widgets = { };

        if (this._options.header){
            widgets.header = {view: Header, options:{ header:this.get("header"), resizable: this._options.resizable }}
        }

        if (this._options.footer){
            widgets.footer = {view: Footer, options:{ header:this.get("footer") }}
        }

        if (this._options.pager){
            widgets.pager = {view: Pager, options:this.get("pager")}
        }

        return widgets;
    }

    markup(){
        const $markup = $(`<div class="${ style.grid }">
            <div class="${ style.wrapper }">
                <table class="${ style.table }">
                    <thead name="header"></thead>
                    <tbody></tbody>
                    <tfoot name="footer"></tfoot>
                </table>
            </div>
            <div name="pager" class="${ style.pager }"></div>
        </div>`);

        this.$tbody = $markup.find('tbody');

        return $markup;
    };

    newItem( id ){
        return new Row({
            id:id,
            $container:this.$tbody,
            columns:this._options.columns
        });
    }

}
View.extend();



class Row extends Item{

    static options = {
        columns:{ type:types.primitives.Array, required:true }
    };

    markup() {
        const $markup = $(`<tr></tr>`);
        this._options.columns.forEach((_,i)=> $(`<td name="${ i }"></td>`).appendTo($markup) );
        return $markup;
    }

    widgets(){
        return this._options.columns.reduce((acc, col, i)=>{
            acc[i] = col;
            return acc;
        },{});
    }
}
Row.extend();

class Cell extends Item{
    static options = {
        text:{type:types.primitives.Any}
    };
    constructor(options) {
        super(options);

        this.bind("text", val=>this._options.$container.html( val ))
    }
}
Cell.extend();



