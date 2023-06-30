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
import style from "../grid.css";
import {util} from "../../../utilities";
import {View as Collection} from "../../collection";

export class Row extends Item{

    static options = {
        columns:{type:types.primitives.Array, required:true},
        selected:{type:types.primitives.Bool},
        parentRow:{type: types.primitives.Instance, options:{class:Row}},
        previousRow:{type: types.primitives.Instance, options:{class:Row}},
        numerated:{type:types.primitives.Bool, default:false},
        index:{type:types.primitives.String, default:"0"}
    };

    #indexPrefix = "";
    #children;
    #unbind = [];

    constructor( options ) {
        super( options );

        this.bind("selected", (val=false) => {
            this.$markup.toggleClass(style.selected_row, val);
        });


        if (this._options.parentRow){

            this.#placeAfter( this._options.previousRow );

            if (this._options.numerated ){
                this._options.parentRow.bind("index", parentIndex=>{
                    this.#indexPrefix = parentIndex + ".";
                    this.#updateIndex();
                })
            }
        }

        this.bind("previousRow", row=>{
            this.#unbind.forEach( u => u());
            this.#unbind = [];

            if (row){
                this.#unbind.push(()=> row.unbind( row.bind("destroy",()=>{
                    this.set({previousRow: row.get("previousRow")})
                })));

                if (this._options.numerated){
                    this.#unbind.push(()=> row.unbind( row.bind("index",()=>{
                        this.#updateIndex( );
                    })));
                }
            }

            this.#placeAfter( row )
        })
    }



    markup() {
        const id = util.data.GUID();
        const $markup = $(`<tr data-row-id="${id}"></tr>`);
        $markup.data("row", this);

        this._options.columns.forEach((_,i)=>{
            $(`<td name="${ i }"></td>`).appendTo($markup);
        });

        return $markup;
    }

    widgets(){
        return this._options.columns.reduce((acc, col, i)=>{
            acc[i] = col;
            return acc;
        },{});
    }

    getLastChild(){
        if (this.#children){
            return this.#children.getLastItem();
        }else{
            return undefined;
        }
    }

    unfold( controller ){
        if (this.#children) this.#children.destroy();

        this.#children = new RowsCollection({ parent:this, data:controller });
    }

    fold(){
        if (this.#children) this.#children.destroy();
        this.#children = undefined;
    }

    destroy() {
        this.#unbind.forEach( u => u());
        this.#unbind = undefined;

        if (this.#children){
            this.#children.destroy();
            this.#children = undefined;
        }

        super.destroy();
    }

    #placeAfter( previousRow ){
        if (previousRow){
            const lastChild = previousRow.getLastChild();
            if (lastChild){
                this.$markup.insertAfter( lastChild.$markup );
            }else{
                this.$markup.insertAfter( previousRow.$markup );
            }
        }else if(this._options.parentRow){
            this.$markup.insertAfter( this._options.parentRow.$markup );
        }else{
            this.$markup.prependTo(this._options.$container)
        }
    }

    #updateIndex( prefix ){
        const index = this._options.previousRow
            ? this._options.previousRow.get("index").split(".").pop()
            : 0;

        this.set({index: "" + prefix + index})
    }
}
Row.extend();

class RowsCollection extends Collection{

    static options = {
        parent:{type: types.primitives.Instance, options:{class:Row}}
    };

    newItem( id, previousRow ){
        const index = previousRow
            ? previousRow.get("index").split(".").pop()
            : "0";

        return new Row({...this._options.parent._options, ...{
            id:id,
            parentRow:this._options.parent,
            previousRow:previousRow,
            index:index
        }});
    }

    _placeItem( row, previousRow ){
        row.set({previousRow});
    }


}
RowsCollection.extend();