import {View as Parent} from "../../view/item.js";

export class Layout extends Parent {

    static events = {onSelect: true}

    static options = {
        tabs:{ type:types.complex.Array },
        active:{type:types.primitives.Integer, default:0}
    };

    static markup = `<div>
        <div name="menu"></div>
        <div name="tab"></div>
    </div>`;

    widgets() {
        return {
            menu: {
                view: Menu,
                options:{
                    tabs:this._options.tabs,
                    value:this._options.active,
                    links:{ tabs:"parent@tabs", value:"parent@active" },
                    events:{ value:"parent@active"}
                }
            },
            tab: {
                view: Tab,
                options:{
                    tabs:this._options.tabs,
                    links: {tabs: "parent@tabs", value: "parent@active"}
                }
            }
        }
    }

    constructor( options ){

        super( options );

        this.linkWidgets( {parent:this} );
    }
}