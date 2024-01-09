
import {Control} from "./control.js";
import {types} from "../../types/index.js";
import { controls } from "./index.js";
import {View as Flex} from "../collections/flex.js";
import {View as ItemView} from "../item.js";
import { controllers } from "../../controllers";
import UpIcon from "../../../src/img/arrow_up.png";
import DownIcon from "../../../src/img/arrow_down.png";
import DeleteIcon from "../../img/delete.png";
import styles from "./itemList.css";


export class ItemList extends Control{
    static options = {
        item:{type:types.complex.Item, options:{schema:{
            view:{type: types.primitives.Class, options:{class:Control}, required:true },
            options:{type: types.primitives.Set }
        }}, required:true},
        value: {type: types.primitives.Array, default: []}
    }

    static markup = `<div name="items" class="${ styles.itemList } item_item_list"></div>`;

    updateValue( value ) {
        const set = Object.keys(this.itemcontroller.get()).reduce((acc,_,i) => {
            acc[i] = null;
            return acc;
        }, {});
        let i = 0;
        for (; i < value.length; i++){
            set[i] = { index: i, value: value[i], isUp: true, isDown: true, isDelete: true };
        }
        set["0"] = { index: 0, value: value[0], isDown: i > 1, isUp: false, isDelete: true };
        if (i > 1) {
            set[i - 1] = { index: i - 1, value: value[i - 1], isDown: false, isUp: true, isDelete: true };
        }
        this.itemcontroller.set(set);
        this.itemcontroller.set({[value.length]: {index: value.length, value: null, isDelete: false, isUp: false, isDown: false}});
    }

    widgets(){
        this.itemcontroller = new controllers.Collection({
            id:"index",
            schema:{
                index:{ type: types.primitives.Integer },
                value:{type: types.primitives.Any},
                isDelete:{type: types.primitives.Bool, default: true},
                isUp:{type: types.primitives.Bool, default: true},
                isDown:{type: types.primitives.Bool, default: true},
            },
            keyCompare:([a],[b])=>{
                a = +a;
                b = +b;
                if ( a > b ) return 1;
                if ( a < b ) return -1;
                return 0;
            },
            data:[]
        });

        return {
            items: {
                view: Flex,
                options: {
                    data: this.itemcontroller,
                    direction:"vertical",
                    classes:[styles.flex_collection],
                    item: {
                        view: ListItem,
                        options: {
                            item: this._options.item,
                            links: {
                                value: "data@value",
                                index: "data@index",
                            },
                            events: {
                                onDelete: {handler: index => {
                                    const value = this.get("value");
                                    if (value.length === 1){
                                        this.set({value: []});
                                    } else {
                                        value.splice(index, 1);
                                        this.set({value});
                                    }
                                }},
                                onReorder: {handler: (from, to) => {
                                    const value = this.get("value");
                                    [ value[from], value[to] ] = [value[to], value[from]];
                                    this.set({value});
                                }},
                                value: (value, prev, controller, {self})=>{
                                    if (!value) return;
                                    const val = this.get("value");
                                    val[self._options.index] = value;
                                    this.set({value: val});
                                }
                            },
                        }
                    }
                }

            }
        }
    }
}
ItemList.extend();

class ListItem extends ItemView{

    static options = {
        item:{type:types.complex.Item, options:{schema:{
            view:{type: types.primitives.Class, options:{class:Control}, required:true },
            options:{type: types.primitives.Set }
        }}, required:true},
        value:{type: types.primitives.Any},
        index:{type: types.primitives.Integer},
        isDelete:{type: types.primitives.Bool, default: true},
        isUp:{type: types.primitives.Bool, default: true},
        isDown:{type: types.primitives.Bool, default: true},
    }

    static events = {
        onDelete: true,
        onReorder: true
    }

    static markup = `<div class="${styles.item} item">
        <div name="content" class="${ styles.content } content"></div>
        <div class="${ styles.buttons_block } buttons_block">
            <div name="up"></div>
            <div name="down"></div>
            <div name="delete"</div>
        </div>
    </div>`;

    widgets(){
        const { view, options } = this._options.item;
        if (typeof options.links === "object"){
            options.links.value = "parent@value";
        } else {
            options.links = { value: "parent@value" };
        }
        if (typeof options.events === "object"){
            options.events.value = "parent@value";
        } else {
            options.events = { value: "parent@value" };
        }

        return {
            content: { view, options },
            up: {
                view: controls.Button,
                options: {
                    icon: `url("${UpIcon}")`,
                    links:{ enable: "data@isUp" },
                    events: {
                        click: { handler: () => this._trigger("onReorder", [this._options.index, this._options.index-1]) }
                    }
                }
            },
            down: {
                view: controls.Button,
                options: {
                    icon: `url("${DownIcon}")`,
                    links:{ enable: "data@isDown" },
                    events: {
                        click: { handler: () => this._trigger("onReorder", [this._options.index, this._options.index+1]) }
                    }
                }
            },
            delete: {
                view: controls.Button,
                options: {
                    icon: `url("${DeleteIcon}")`,
                    links:{ enable: "data@isDelete" },
                    events: {
                        click: { handler: () => this._trigger("onDelete", [this._options.index]) }
                    }
                }
            }
        }
    }
}
ListItem.extend();
