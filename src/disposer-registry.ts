import { Disposer } from "./types";

export class DisposerRegistry {
  private contextDom: any;
  private domToDisposers: WeakMap<any, Array<Disposer>> = new WeakMap();

  onAddResult(searchResultDom: any) {
    this.contextDom = searchResultDom;
    if (!this.domToDisposers.has(this)) {
      this.domToDisposers.set(this, []);
    }
  }

  addOnEmptyResultsCallback(fn: Disposer) {
    if (!this.contextDom) {
      throw new Error(
        "You rendered a Solid root before you got a reference to the containing searchResultDom"
      );
    }
    this.domToDisposers.get(this.contextDom)?.push(fn);
  }

  onEmptyResults(searchResultDom: any) {
    this.domToDisposers.get(searchResultDom)?.forEach((disposer) => disposer());
    this.domToDisposers.set(searchResultDom, []);
  }
}
