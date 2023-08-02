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
import Bills from "../containers/Bills.js";
import { ROUTES } from "../constants/routes";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import win from "global";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store";
import { bills } from "../fixtures/bills.js";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

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

    describe("There are bills to display", () => {
      // Initialize DOM
      beforeAll(() => {
        document.body.innerHTML = BillsUI({ data: bills });
      });

      describe("One bill has pending status", () => {
        it("should display one element whith pending status", () => {
          const pendingBills = screen.getAllByText("pending");
          expect(pendingBills.length).toBe(1);
          pendingBills.forEach((bill) => {
            expect(bill.nodeName).toBe("TD");
          });
        });
      });

      describe("Two bills have refused status", () => {
        it("should display two elements whith refused status", () => {
          const refusedBills = screen.getAllByText("refused");
          expect(refusedBills.length).toBe(2);
          refusedBills.forEach((bill) => {
            expect(bill.nodeName).toBe("TD");
          });
        });
      });

      describe("One bill has accepted status", () => {
        it("should display one element whith accepted status", () => {
          const acceptedBills = screen.getAllByText("accepted");
          expect(acceptedBills.length).toBe(1);
          acceptedBills.forEach((bill) => {
            expect(bill.nodeName).toBe("TD");
          });
        });
      });

      test("Then bills should be ordered from earliest to latest", () => {
        const dates = screen
          .getAllByText(
            /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
          )
          .map((a) => a.innerHTML);
        const antiChrono = (a, b) => (a < b ? 1 : -1);
        const datesSorted = [...dates].sort(antiChrono);
        expect(dates).toEqual(datesSorted);
      });
      // Reset DOM
      afterAll(() => {
        document.body.innerHTML = "";
      });
    });

    // TODO test table w/o bills

    describe("When I click on new bill button", () => {
      test("Then I shoud be redirected to NewBill page", () => {
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        document.body.innerHTML = BillsUI({ data: bills });
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const store = null;
        const billsJs = new Bills({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });
        const handleClickNewBill = jest.fn(billsJs.handleClickNewBill);
        const buttonNewBill = document.querySelector(
          `button[data-testid="btn-new-bill"]`
        );
        buttonNewBill.addEventListener("click", handleClickNewBill);
        userEvent.click(buttonNewBill);
        expect(handleClickNewBill).toHaveBeenCalled();
        document.body.innerHTML = "";
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();
        window.onNavigate(ROUTES_PATH.NewBill);
        expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
      });
    });

    describe("When I click on the eye icon", () => {
      // TODO tester la présence d'un fichier?
      beforeEach(() => {
        jQuery.fn.modal = () => {};
      });
      test("A modal should open", async () => {
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        document.body.innerHTML = BillsUI({ data: bills });
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const store = null;
        const billsJs = new Bills({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });
        await waitFor(() => screen.getAllByTestId("icon-eye"));
        const eyes = screen.getAllByTestId("icon-eye");
        const handlePreviewFile = jest.fn(billsJs.handleClickIconEye);
        const firstEye = eyes[0];
        firstEye.addEventListener("click", handlePreviewFile(firstEye));
        userEvent.click(firstEye);
        expect(handlePreviewFile).toHaveBeenCalled();
        const modale = screen.getByTestId("modaleFile");
        expect(modale).toBeTruthy();
      });
      afterEach(() => {
        delete jQuery.fn.modal;
      });
    });

    /* describe("mockstore tests", () => {
      test("retrieve data", async () => {
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        document.body.innerHTML = BillsUI({ data: bills });
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const store = mockStore;
        const billsJs = new Bills({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });
        await waitFor(() => billsJs.getBills());
        const tryout = billsJs.getBills();
        expect.assertions(1);
        expect(tryout).resolves.toBeTruthy();
      });
    }); */
  });

  describe("When function getBills is called", () => {
    beforeAll(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = BillsUI({ data: bills });
    });

    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };

    const store = mockStore;
    const billsJs = new Bills({
      document,
      onNavigate,
      store,
      localStorage: window.localStorage,
    });

    it("Should use a promise and return an array of 4 objects if promise is resolved", async () => {
      expect.assertions(1);
      const billsArray = await billsJs.getBills();
      expect(billsArray.length).toBe(4);
    });
  });
});
