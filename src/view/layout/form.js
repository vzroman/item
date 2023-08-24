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
import {text as i18n} from "../../i18n/i18n.js";
import {deepMerge} from "../../utilities/data.js";

import styles from "./form.css";


export class Form extends Parent{

    static options = {
        view:{type: types.primitives.Class, options:{class:Parent}, required:true },
        options:{type: types.primitives.Set },
        commit:{type: types.primitives.Fun, default:data => data.commit() },
        rollback:{type: types.primitives.Fun, default:data => data.rollback() }
    };

    static links = {
        "!_commit":"commit",
        "!_reject":"reject",
        "!_rollback":"rollback"
    };

    static events = {
        commit:true,
        error:true,
        cancel:true
    };

    static markup = `<div class="${ styles.form }">
        <div name="view" style="flex-grow: 1"></div>
        <div class="${ styles.button_block }">
            <div name="save"></div>
            <div name="cancel"></div>
        </div>
    </div>`;

    widgets(){
        return {
            view: {
                view: this._options.view,
                options: deepMerge({
                    links:{
                        focus:"committable"
                    }
                }, this._options.options)
            },
            save: {
                view: controls.Button,
                options:{
                    text:i18n("save"),
                    enable:false,
                    links:{ enable:"committable" },
                    events:{ click:() => this._options.commit( this._options.data ) }
                }
            },
            cancel: {
                view: controls.Button,
                options:{
                    text:i18n("cancel"),
                    enable:false,
                    links:{ enable:"committable"},
                    events:{ click:()=> this._options.rollback( this._options.data ) }
                }
            }
        }
    }

    destroy(){
        if (this._onError) this._onError();
        this._onError = undefined;
        super.destroy();
    }

    _commit(){
        this._trigger("commit",[this._options.data?.get()])
    }

    _reject( error ){
        this._trigger("error", error);
    }

    _rollback(){
        this._trigger("cancel");
    }

}
Form.extend();
