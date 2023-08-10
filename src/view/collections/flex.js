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

import {View as Collection} from "../collection.js";
import {View as Item} from "../item.js";
import {types} from "../../types/index.js";
import mainCss from "../../css/main.css";

export class View extends Collection{

    static options = {
        direction:{type:types.primitives.String, default:"vertical"},
        flexWrap:{type:types.primitives.String, default:"nowrap"},
        item:{type:types.complex.Item, options:{schema:{
            view:{type: types.primitives.Class, options:{class:Item}, required:true },
            options:{type: types.primitives.Set }
        }}, required:true},
    };

    constructor(options) {
        super( options );

        this.bind("flexWrap", val => this.$markup.css({"flex-wrap":val}))
    }


    markup(){
        return `<div class="${ mainCss[this._options.direction] } flex-collection"></div>`;
    };

    newItem( id ){
        const {view, options} = this._options.item;
        return new view({...options, id, $container:this.$markup});
    }
}
View.extend();
