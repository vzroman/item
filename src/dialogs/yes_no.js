import {View as Item} from "../view/item"
import {Window} from "../view/layout/window";
import {types} from "../types";
import {controls} from "../view/controls";
import {Label} from "../view/primitives/label";
import * as i18n from "../i18n/i18n"
import icon from "./question.svg"
import styles from "./yes_no.css"

export function yes_no( text ){
    return new Promise((resolve, reject) =>{
        const dialog = new Window({
            icon:`url("${ icon }")`,
            modal: true,
            actions:[],
            view:{
                view:Form,
                options:{
                    text,
                    events:{
                        onYes : ()=>{
                            dialog.destroy();
                            resolve();
                        },
                        onNo: ()=>{
                            dialog.destroy();
                            reject();
                        }
                    }
                }
            }
        });
    })
}

class Form extends Item{
    static options = {
        text:{type: types.primitives.String}
    }

    static events = {
        onYes:true,
        onNo:true
    }


    static markup = `<div class="${styles.yes_no} item_yes_no">
        <div name="text"></div>
        <div class="${ styles.buttons_block } buttons_block">
            <div name="yes"></div>
            <div name="no"></div>
        </div>
    </div>`;


    widgets(){
        return {
            text:{
                view:Label,
                options:{ text:this._options.text, classes:[styles.content]}
            },
            yes:{
                view:controls.Button,
                options:{
                    text:i18n.text("yes"),
                    events: {
                        click:()=>this._trigger("onYes")
                    }
                }
            },
            no:{
                view:controls.Button,
                options:{
                    text:i18n.text("no"),
                    events: {
                        click:()=>this._trigger("onNo")
                    }
                }
            }
        }
    }
}
Form.extend();