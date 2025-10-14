
import {Control} from "./control.js";
import {types} from "../../types/index.js";
import { controls } from "./index.js";
import {View as Flex} from "../collections/flex.js";
import {View as ItemView} from "../item.js";
import { controllers } from "../../controllers";
import { deepEqual } from "../../utilities/data.js";
import UpIcon from "../../../src/img/arrow_up.svg";
import DownIcon from "../../../src/img/arrow_down.svg";
import DeleteIcon from "../../img/delete.svg";
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

    updateValue( value =[] ) {

        value = value.filter( v => v  !==  undefined && v !== null );

        const itemsSet = this._itemsController.get();
        let items = itemsList( itemsSet );

        items = mergeValue( items, value );

        let isFilled = true;
        for (let i=0; i < items.length; i++){

            const v = items[i];
            isFilled &= v !== undefined && v !== null;
            itemsSet[i] = {
                index: i,
                value: v,
                isUp: true,
                isDown: true,
                isDelete: true
            };

        }
        const rest = Object.keys(itemsSet).length;

        for (let i = items.length; i < rest; i++){
            itemsSet[i] = null;
        }

        itemsSet[0] = { index: 0, value: items[0], isDown: items.length > 1, isUp: false, isDelete: true };

        if (isFilled){
            if ((items.length - 1) in itemsSet) {
                itemsSet[items.length - 1].isDown = false;
            }
            itemsSet[items.length] = {
                index: items.length,
                value: undefined,
                isDelete: false,
                isUp: false,
                isDown: false
            };
        }else if(items.length>0){
            itemsSet[items.length - 1] = {
                index: items.length - 1,
                value: items[items.length - 1],
                isDown: false,
                isUp: true,
                isDelete: true
            };
        }


        this._itemsController.set( itemsSet );
    }

    widgets(){

        this._itemsController = new controllers.Collection({
            id:"index",
            schema:{
                index:{ type: types.primitives.Integer },
                value:{type: types.primitives.Any},
                isDelete:{type: types.primitives.Bool, default: true},
                isUp:{type: types.primitives.Bool, default: true},
                isDown:{type: types.primitives.Bool, default: true},
            },
            orderBy:[["index","asc"]],
            autoCommit:false,
            data:[]
        });

        const update = (items)=>{
            items = {...this._itemsController.get(), ...items};
            let value = itemsList( items )
                .filter(v => (v !== undefined && v !== null));
            if (value.length === 0) value = null;
            this.set({value});
        };

        return {
            items: {
                view: Flex,
                options: {
                    data: this._itemsController,
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
                                    update({[index]:null});
                                }},
                                onReorder: {handler: (from, to) => {
                                    const items = this._itemsController.get([from,to]);
                                    [ items[from].value, items[to].value ] = [ items[to].value, items[from].value ];
                                    update(items);
                                }},
                                value: (value, prev, controller, {self})=>{
                                    if (value===null) value = undefined;
                                    const i = self._options.index;
                                    const item = this._itemsController.get( ''+i );
                                    update({ [i]: {...item, value } });
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
        const { view, options={} } = this._options.item;
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

//---------------------------------------------------------------------------
//  Internal helpers
//---------------------------------------------------------------------------
function itemsList( itemsSet ){
    return Object.entries( itemsSet )
        .sort((a,b)=>{
            a = +a;
            b = +b;
            if ( a > b ) return 1;
            if ( a < b ) return -1;
            return 0;
        })
        .filter(([i,value])=>!!value)
        .map(([i,{value}])=> value);
}

function mergeValue( items, value ){
    const counts = countItems(value);
    items = filterCountItems(items, counts);
    // Remove not existent items, but keep undefined
    items = items.filter( item => item === undefined || item === null || indexOf( item, value ) !==-1 );

    // If the last item is undefined, then we consider it a placeholder
    const lastItem = items[items.length-1];
    if (lastItem === undefined || lastItem===null){
        items = items.slice(0, -1);
    }

    let i = 0;
    for (const v of value){

        // keep undefined items
        while (i < items.length && (items[i] === undefined || items[i]===null)){
            i++;
        }

        if (deepEqual( v, items[i] )){
            i++;
            continue;
        }

        const prev = indexOf( v, items, i );
        if (prev !== -1){
            items.splice(prev,1)
        }

        items.splice( i, 0, v)
        i++;
    }

    return items;
}

function countItems(array) {
    const counts = [];
    for (const item of array) {
        const found = counts.find(entry => {
            return deepEqual(entry.value, item)
        });
        if (found) {
            found.count++;
        } else {
            counts.push({ value: item, count: 1 });
        }
    }
    return counts;
}

function filterCountItems(items, counts) {
    const result = [];
    for (const item of items) {
        if (item === undefined || item === null) {
            result.push(item);
            continue;
        }

        const match = counts.find(entry => {
            return deepEqual(entry.value, item) && entry.count > 0;
        });
        if (match) {
            result.push(item);
            match.count--;
        }
    }
    return result;
}

function indexOf( item, value, startFrom =0){
    let result = -1;
    for (let i = startFrom; i < value.length; i++){
        if (deepEqual( value[i], item )){
            result = i;
            break;
        }
    }
    return result;
}
