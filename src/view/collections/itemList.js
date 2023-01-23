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

import {View as Flex} from "./flex.js";
import {View as Item} from "../item.js";
import {types} from "../../types/index.js";
import {controls} from "../controls/index.js";
import mainCss from "../../css/main.css";
import style from "./itemList.css";


export class View extends Flex{

    static options = {
        confirm:{ type:types.primitives.Fun }
    };

    markup(){
        return `<div class="${ mainCss.vertical }">
            <div name="items"></div>
            <div style="display: flex; justify-content: flex-start">
                <div name="addItem"></div>
            </div>
        </div>`;
    };

    widgets(){
        return {
            addItem:{
                view: controls.Button,
                options:{
                    text:"add",
                    events:{ click:()=>this.addItem() }
                }
            }
        }
    }

    constructor( options ){
        super( options );

        this.$items = this.$markup.find('[name="items"]');
    }


    newItem( id ){
        return new Wrapper({
            id,
            $container:this.$items,
            item: this._options.item,
            events:{remove:() => {
                if ( this._options.confirm ){
                    this._options.confirm( id ).then(() => this.removeItem( id ),()=>{})
                }else{
                    this.removeItem( id )
                }
            }}
        });
    }
}
View.extend();

class Wrapper extends Item{

    static options = {
        item:{type:types.complex.Item, options:{schema:{
            view:{type: types.primitives.Class, options:{class:Item}, required:true },
            options:{type: types.primitives.Set }
        }}, required:true}
    };

    static events = {
        remove:true
    };

    markup(){
        return `<div class="${ style.item }">
            <div name="remove"></div>
            <div name="item"></div>
        </div>`;
    }

    widgets(){
        let {view, options} = this._options.item;
        options = {...options, id:this._options.id};
        return {
            remove:{
                view: controls.Button,
                options:{
                    text:"remove",
                    events:{ click:() => this._trigger("remove") }
                }
            },
            item:{view, options}
        }
    }

}
Wrapper.extend();

