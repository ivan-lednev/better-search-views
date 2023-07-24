import { Disposer } from "./types";

export class DisposerRegistry {
  private contextDom: any;
  private domToDisposers: WeakMap<any, Array<Disposer>> = new WeakMap();

  /**
   * We assume here that match results are going to be added synchronously to the same dom, on which onAddResult is
   * called
   * @param searchResultDom
   */
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

  /**
   * This may be called before any results are added
   * @param searchResultDom
   */
  onEmptyResults(searchResultDom: any) {
    this.domToDisposers.get(searchResultDom)?.forEach((disposer) => disposer());
    this.domToDisposers.set(searchResultDom, []);
  }
}
