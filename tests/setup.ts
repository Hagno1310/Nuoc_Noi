import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Vitest không bật globals, nên Testing Library không tự dọn DOM giữa các test
afterEach(() => {
  cleanup();
  localStorage.clear();
});


// jsdom có <dialog> nhưng chưa có showModal/close: polyfill tối thiểu cho hộp thoại sửa (EditDialog)
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}
