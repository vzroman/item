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
import {types} from "../../types";
import mainCss from "../../css/main.css";
import {controls} from "../controls";

export class Pager extends ItemView{

    static options = {
        page:{type:types.primitives.Integer, default: 1},
        totalCount:{type:types.primitives.Integer},
        pageSize:{type:types.primitives.Integer},
        pageSizeValues:{type:types.primitives.Array, default: [30, 100, 10000]},
        maxVisible:{type:types.primitives.Integer, default: 10}
    };

    static markup = `<button class="${ mainCss.horizontal }" style="justify-content: space-between">
        <div class="${ mainCss.horizontal }">
            <div name="first"></div>
            <div name="prev"></div>
            <div name="pages"></div>
            <div name="next"></div>
            <div name="last"></div>
        </div>
        <div name="page-size"></div>
        <div name="total"></div>
    </button>`;

    widgets(){
        return {
            first: {
                view: controls.Button,
                options: {
                    text:{type:types.primitives.String},
                    title:{type:types.primitives.String},
                    icon:{type:types.primitives.String},
                    links: {
                        //enable:"parent@page"
                    },
                    events:{
                        //click:"parent@page"
                    }
                }
            }
        }
    }


}
Pager.extend();
