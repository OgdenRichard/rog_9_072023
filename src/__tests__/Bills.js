/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import {
  screen,
  waitFor,
  toHaveClass,
  queryAllByText,
} from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import router from "../app/Router.js";
import win from "global";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      // check if bill icon has the proper class to be highlighted
      expect(windowIcon).toHaveClass("active-icon");
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    describe("There are bills to display", () => {
      describe("One bill has pending status", () => {
        document.body.innerHTML = BillsUI({ data: bills });
        it("should display one element whith pending status", () => {
          const pendingBills = screen.getAllByText("pending");
          expect(pendingBills.length).toBe(1);
        });
      });

      describe("Two bills have refused status", () => {
        document.body.innerHTML = BillsUI({ data: bills });
        it("should display two elements whith refused status", () => {
          const refusedBills = screen.getAllByText("refused");
          expect(refusedBills.length).toBe(2);
        });
      });

      describe("One bill has accepted status", () => {
        document.body.innerHTML = BillsUI({ data: bills });
        it("should display one element whith accepted status", () => {
          const acceptedBills = screen.getAllByText("accepted");
          expect(acceptedBills.length).toBe(1);
        });
      });
    });
  });
});
