import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Vitest không bật globals, nên Testing Library không tự dọn DOM giữa các test
afterEach(() => {
  cleanup();
  if (typeof localStorage !== "undefined") {
    localStorage.clear();
  }
});


// jsdom có <dialog> nhưng chưa có showModal/close: polyfill tối thiểu cho hộp thoại sửa (EditDialog)
if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}

// jsdom chưa có matchMedia: mặc định là màn hẹp (điện thoại); test màn rộng tự mock lại
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
