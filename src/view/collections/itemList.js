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
import DeleteIcon from "../../img/delete.svg";


export class View extends Flex{

    static options = {
        confirm:{ type:types.primitives.Fun },
        buttonText : { type: types.primitives.String },
    };

    markup(){
        return `<div class="${ mainCss.vertical } ${ style.item_wrapper }">
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
                    text:this._options.buttonText,
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
            events:{
                remove:() => {
                    if ( this._options.confirm ){
                        this._options.confirm( id ).then(() => this.removeItem( id ),()=>{})
                    }else{
                        this.removeItem( id )
                    }
                }
            }
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
            <div name="item"></div>
            <div name="remove"></div>
        </div>`;
    }

    widgets(){
        let {view, options} = this._options.item;
        options = {...options, id:this._options.id};

        return {
            remove:{
                view: controls.Button,
                options:{
                    icon:`url("${DeleteIcon}")`,
                    events:{ click:() => this._trigger("remove") }
                }
            },
            item:{view, options}
        }
    }

}
Wrapper.extend();