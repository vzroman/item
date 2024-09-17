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

import {View as ItemView} from "../item.js";
import {types} from "../../types/index.js";
import {controls} from "../controls"
import ascending_arrow from "./sortButton/ascending_arrow.svg"
import descending_arrow from "./sortButton/descending_arrow.svg"



export class SortButton extends ItemView{

    static options = {
        name:{type:types.primitives.String},
        orderBy:{type:types.primitives.String},
        ascendingCompare:{type:types.primitives.Fun, required: true},
        descendingCompare:{type:types.primitives.Fun, required: true}
    };

    #initOrderBy
    #initKeyCompare

    static markup = `
    <div style="display:flex">
       <div name="sort" style="flex-grow:1"></div>
       <div name="sort_icon"></div>
    </div>`;
 
    constructor( options ) {
        
        super( options );

        this.#initOrderBy = this._options.data.get("$.orderBy")
        this.#initKeyCompare = this._options.data.get("$.keyCompare")

        this.compareList = {
            init: this.#initKeyCompare,
            ascending: this.get("ascendingCompare"),
            descending: this.get("descendingCompare")
        }
        this.compareIndex = 0;

        const _controller = this._options.data
        _controller.bind("$.keyCompare", (keyCompare)=>{
            const orderBy = _controller.option("orderBy")
            let icon ={
                "display":"block",
                "width":"20px",
                "background-size":"cover"
            }
            const sortIcon = this.$markup.find('[name="sort_icon"]')
            if(orderBy === this.get("orderBy")){

                if(keyCompare.toString() === this.compareList.ascending.toString()){
                    icon["background-image"] = `url("${ascending_arrow}")`
                }else if(keyCompare.toString() === this.compareList.descending.toString()){
                    icon["background-image"] = `url("${descending_arrow}")`
                }
                sortIcon.css(icon)
            }else{
                icon["display"] = "none"
                sortIcon.css(icon)
            }
        })
    }

    widgets(){

        
        return {
            sort:{
                view: controls.Button,
                options: {
                    links:{
                        text:"parent@name"
                    },
                    events:{
                        click:()=>{
                            this.reorder()
                        }
                    }
                }
            }
        }
    }

    reorder(){
        const controller = this._options.data
        const compareList = this.compareList
        const orderBy = this.get("orderBy")
        const prevOrderBy = controller.get("$.orderBy");
        const _keyCompare = controller.get("$.keyCompare");
        
        if(_keyCompare.toString() === compareList.descending.toString()){
            controller.option("orderBy", this.#initOrderBy)
            controller.option("keyCompare", this.#initKeyCompare)
            return
        }

        controller.option("orderBy", orderBy)
        let keyCompare
        if(prevOrderBy === orderBy && _keyCompare.toString() === compareList.ascending.toString()){
            keyCompare = compareList.descending
        }else{
            keyCompare = compareList.ascending
        }
        controller.option("keyCompare", keyCompare)
    }
}
SortButton.extend();
