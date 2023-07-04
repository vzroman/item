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

import {View as ItemView} from "../item";
import {types} from "../../types/index.js";
import {Grid} from "./grid";
import mainStyles from "../../css/main.css"
import {Label} from "../primitives/label";

export class TreeGrid extends ItemView{

    static options = {
        ...Grid.options,
        getSubitems:{type:types.primitives.Fun},
        isFolder:{type:types.primitives.Fun},
        getIcon:{type:types.primitives.Fun}
    };

    static markup = `<div class="${ mainStyles.vertical }">
        <div name="breadcrumps"> TODO breadcrumps </div>
        <div name="grid"></div>
    </div>`;

    constructor( options ) {


        super( options );
    }

    widgets(){
        const options = this.get();
        options.columns[0] = {
            view: TreeCell,
            options: {
                column: options.columns[0],
                getSubitems: this._options.getSubitems,
                isFolder: this._options.isFolder,
                getIcon: this._options.getIcon,
                events:{
                    drillDown:( whatShouldBeHere )=>{
                        console.debug("TODO: drillDown a row", whatShouldBeHere)
                    }
                }
            }
        };

        return {
            grid:{ view:Grid, options:options }
        }

    }
}
TreeGrid.extend();

class TreeCell extends ItemView{

    static options = {
        column: {type: types.primitives.Any},
        getSubitems:{type:types.primitives.Fun},
        isFolder:{type:types.primitives.Fun},
        getIcon:{type:types.primitives.Fun},
        icon:{type:types.primitives.String},
        isExpandable:{type:types.primitives.Bool},
        isExpanded:{type:types.primitives.Bool}
    };

    static events = {
        drillDown: true
    }

    #parent;
    #data;
    #isFolder = false;

    static markup = `<div class="${ mainStyles.horizontal }">
        <div name="offset"></div>
        <div name="expand"></div>
        <div name="icon"></div>
        <div name="cell"></div>
        <div name="total"></div>
    </div>`;

    widgets() {

        this.$offset = this.$markup.find('[name=offset]');

        return {
            expand:{
                view:Label,
                options: {
                    links:{
                        text:{source:"parent", event:["isExpandable","isExpanded"], handler:({isExpandable,isExpanded})=>{
                            if (isExpanded) return "-";
                            if (isExpandable) return "+";
                            return " "
                        }}
                    },
                    events: {
                        click:{  }
                    }
                }
            }
        }

    }

    link( context ){
        if (!this.#parent && context.parent){
            this.#parent = context.parent;
            let level = 0, row = this.#parent.get("parentRow");
            while ( row ){
                level++;
                row = row.get("parentRow");
            }
            this.$offset.width(level + 10);

            this.#parent.bind("dblClick",()=>{
                if (this.#isFolder){
                    this._trigger("drillDown",[this.#data, this.#parent?.get("data")])
                }
            })
        }
        if (!this.#data && context.data){
            this.#data = context.data;
            this.#isFolder = this._options.isFolder ? this._options.isFolder( this.#data ) : false;

            if (this._options.getIcon){
                this.#data.bind("change",()=>{
                    let icon = this._options.getIcon( this.#data );
                    if (!icon){
                        icon = this.#isFolder ? "TODO:folderIcon" : "TODO: itemIcon"
                    }
                    this.set({icon});
                });
            }
        }
    }

    #fold(){

    }

    #unfold(){

    }

}
TreeCell.extend();
