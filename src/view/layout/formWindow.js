import {Window} from "./window.js";
import {Form} from "./form.js";
import {types} from "../../types";

export class FormWindow extends Window{

    static options = {
        closeOnCommit:{type: types.primitives.Bool, default: true},
        closeOnCancel:{type: types.primitives.Bool, default: true}
    };

    static events = {
        commit: true,
        cancel: true,
        error: true
    };

    widgets() {
        return {
            ...super.widgets(),
            view: {
                view: Form,
                options:{
                    view: this._options.view.view,
                    options: this._options.view.options,
                    events: {
                        error:(...args)=>this._trigger("error", args),
                        commit:(...args)=>{
                            this._trigger("commit",args);
                            if (this._options.closeOnCommit) this.destroy();
                        },
                        cancel:(...args)=>{
                            this._trigger("cancel",args);
                            if (this._options.closeOnCancel) this.destroy();
                        }
                    }
                }
            }
        };
    }
}
FormWindow.extend();