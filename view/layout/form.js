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

import {View as Parent} from "../item.js";
import {types} from "../../types/index.js";
import {controls} from "../controls/index.js";
import {i18n} from "../../i18n/i18n.js";


export class View extends Parent{

    static options = {
        view:{type: types.primitives.Class, options:{class:Parent}, required:true },
        options:{type: types.primitives.Set }
    };

    static events = {
        commit:types.primitives.Any,
        error:types.primitives.Any,
        cancel:types.primitives.Any
    };

    static markup = `<div class="vertical">
        <div name="view"></div>
        <div class="horizontal" style="justify-content: flex-end">
            <div name="save"></div>
            <div name="cancel"></div>
        </div>
    </div>`;

    widgets(){
        return {
            view: {
                view: this._options.view,
                options:{
                    ...this._options.options,
                    links:{
                        focus:"committable"
                    }
                }
            },
            save: {
                view: controls.Button,
                options:{
                    text:i18n("save"),
                    enable:false,
                    links:{ enable:"committable" },
                    events:{ click:(_,{data})=>{
                        // TODO. Waiting
                        data.commit().then(()=>{
                            this._trigger("commit");
                        }, error =>{
                            data.rollback(undefined, error);
                            this._trigger("error", error);
                        })
                    }}
                }
            },
            cancel: {
                view: controls.Button,
                options:{
                    text:i18n("cancel"),
                    enable:false,
                    links:{ enable:"committable"},
                    events:{ click:(_,{data})=>{
                        data.rollback();
                        this._trigger("cancel");
                    }}
                }
            }
        }
    }

}
View.extend();
