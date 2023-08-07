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
import {View as Collection} from "../../collection";
import {Controller as CollectionController} from "../../../controllers/collection";

export class Row extends Item{

    static options = {
        columns:{type:types.primitives.Array, required:true},
        numerated:{type:types.primitives.Bool, default:false},
        selected:{type:types.primitives.Bool},
        getSubitems:{type:types.primitives.Fun},
        parentRow:{type: types.primitives.Instance, options:{class:Row}},
        nextRow:{type: types.primitives.Instance, options:{class:Row}},
        previousRow:{type: types.primitives.Instance, options:{class:Row}},
        index:{type:types.primitives.String, default:"1"},
        level:{type: types.primitives.Integer, default:0},
        isUnfolded:{type:types.primitives.Bool, default:false},
        children:{type: types.primitives.Instance, options:{class:CollectionController}}
    };

    #children;
    #indexPrefix = "";
    #unbind = [];

    constructor( options ) {
        super( options );

        this.#placeAfter( this._options.previousRow );

        this.bind("selected", (val=false) => {
            this.$markup.toggleClass(style.selected_row, val);
            this.$markup.trigger("item-grid-row-select",[this, val]);
        });


        if (this._options.numerated && this._options.parentRow){
            this._options.parentRow.bind("index", parentIndex=>{
                this.#indexPrefix = parentIndex + ".";
                this.#updateIndex();
            });
        }

        this.bind("previousRow", row=>{
            this.#unbind.forEach( u => u());
            this.#unbind = [];

            if (this._options.numerated && row){
                const id = row.bind("index",()=>{
                    this.#updateIndex( );
                });
                this.#unbind.push(()=> row.unbind( id ));
            }
        });
    }



    markup() {
        const $markup = $(`<tr></tr>`);
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

    unfold(  ){

        if (!this._options.getSubitems) return;

        if (this.#children) this.#children.destroy();
        this._options.children?.destroy();

        const controller = this._options.getSubitems( this._options.data.get() );

        this.#children = new RowsCollection({
            $container:this._options.$container,
            parent:this,
            data:controller
        });

        this.set({
            children: controller,
            isUnfolded: true
        });
    }

    fold(){
        if (this.#children) this.#children.destroy();
        this._options.children?.destroy();
        this.#children = undefined;

        this.set({
            children: null,
            isUnfolded: false
        });
    }

    getPath(){
        const path = [];
        let row = this;
        while (row){
            path.unshift(row);
            row = row._options.parentRow
        }
        return path;
    }

    refresh(){
        this._options.children?.refresh();
    }

    destroy() {
        this.$markup.trigger("item-grid-row-select",[this, false]);

        this.#unbind?.forEach( u => u());
        this.#unbind = undefined;

        this._options.nextRow?.set({previousRow: this._options.previousRow});
        this._options.previousRow?.set({nextRow: this._options.nextRow});

        if (this.#children){
            this.#children.destroy();
            this.#children = undefined;
        }

        this._options.children?.destroy();

        super.destroy();
    }

    #placeAfter( previousRow ){
        let nextRow;
        if (previousRow){
            nextRow = previousRow.get("nextRow");
            if (nextRow){
                this.$markup.insertBefore( nextRow.$markup );
            }else{
                this.$markup.insertAfter( previousRow.$markup );
            }
            previousRow.set({nextRow:this});
        }else if(this._options.parentRow){
            if (this._options.parentRow.get("children").get("$.totalCount") > 1){
                nextRow = this.constructor.getItem( this._options.parentRow.$markup.next() );
            }
            this.$markup.insertAfter( this._options.parentRow.$markup );
        }else{
            this.$markup.prependTo(this._options.$container);
            const $firstRow = this._options.$container.children('tr:nth-child(1)');
            if ( $firstRow.length>0 ){
                nextRow = this.constructor.getItem( $firstRow );
                if (nextRow === this) nextRow = undefined;
            }
        }

        if (nextRow){
            nextRow.set({previousRow: this});
            this.set({nextRow});
        }

    }

    #updateIndex(){
        const index = this._options.previousRow
            ? (+this._options.previousRow.get("index").split(".").pop()) + 1
            : 0;

        this.set({index: this.#indexPrefix + index})
    }
}
Row.extend();

class RowsCollection extends Collection{

    static options = {
        parent:{type: types.primitives.Instance, options:{class:Row}}
    };

    newItem( id, previousRow ){
        return new Row({...this._options.parent.get(), ...{
            data:undefined,
            id:id,
            parentRow:this._options.parent,
            nextRow: undefined,
            previousRow:previousRow,
            selected: false,
            isUnfolded:false,
            index:undefined,
            level: this._options.parent.get("level") + 1,
            children:undefined
        }});
    }

    _placeItem( row, previousRow ){
        row.set({previousRow});
    }

    destroy() {
        this._options.data?.destroy();
        super.destroy();
    }


}
RowsCollection.extend();