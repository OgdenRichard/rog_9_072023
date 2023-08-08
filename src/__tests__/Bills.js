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
  });

  // TODO cleanup before/after each - all
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
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
      afterAll(() => {
        document.body.innerHTML = "";
      });
    });

    describe("When I click on new bill button", () => {
      beforeAll(() => {
        document.body.innerHTML = BillsUI({ data: bills });
      });

      test("Then I shoud be redirected to NewBill page", () => {
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
        const buttonNewBill = document.querySelector(
          `button[data-testid="btn-new-bill"]`
        );
        const handleClickNewBill = jest.fn((e) =>
          billsJs.handleClickNewBill(e)
        );
        buttonNewBill.addEventListener("click", handleClickNewBill);
        userEvent.click(buttonNewBill);
        expect(handleClickNewBill).toHaveBeenCalled();
        expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
      });

      afterAll(() => {
        document.body.innerHTML = "";
      });
    });

    describe("When I click on the eye icon", () => {
      beforeEach(() => {
        document.body.innerHTML = BillsUI({ data: bills });
        jQuery.fn.modal = () => {
          const modal = screen.getByTestId("modaleFile");
          modal.classList.add("show");
        };
      });
      test("A modal should open", async () => {
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
        expect(modale).toHaveClass("show");
      });
      afterEach(() => {
        delete jQuery.fn.modal;
      });
    });
    afterAll(() => {
      document.body.innerHTML = "";
    });
  });

  // --------- UNIT TESTS --------- //

  describe("When function getBills is called", () => {
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

    it("Should use one promise and return an array of 4 objects if promise is resolved", async () => {
      expect.assertions(1);
      const billsArray = await billsJs.getBills();
      expect(billsArray.length).toBe(4);
    });

    it("Should return valid dates in a proper format", async () => {
      expect.assertions(1);
      const billsArray = await billsJs.getBills();
      expect(billsArray[0].date).toEqual("4 Avr. 04");
    });

    it("Should return unformatted date value if invalid", async () => {
      jest.spyOn(mockStore, "bills").mockImplementationOnce(() => {
        const billsList = {
          list() {
            return Promise.resolve([
              {
                status: "pending",
                date: "not a date",
              },
            ]);
          },
        };
        return billsList;
      });
      expect.assertions(1);
      const billsArray = await billsJs.getBills();
      expect(billsArray[0].date).toEqual("not a date");
    });
  });
});

// GET - test d'intégration
describe("Given I am connected as an employee", () => {
  describe("When I navigate to bills page", () => {
    it("Should fetch bills from mock API GET", async () => {
      localStorage.setItem(
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
      await waitFor(() => screen.getAllByText("Accepté"));
      const acceptedBills = screen.getAllByText("Accepté");
      expect(acceptedBills.length).toBe(1);
      await waitFor(() => screen.getAllByText("En attente"));
      const pendingBills = screen.getAllByText("En attente");
      expect(pendingBills.length).toBe(1);
      await waitFor(() => screen.getAllByText("Refused"));
      const refusedBills = screen.getAllByText("Refused");
      expect(refusedBills.length).toBe(2);
    });

    describe("When an error occurs whith API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
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
        document.body.appendChild(root);
        router();
      });

      it("Should fetch bills and fail whith a 404 error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      it("Should fetch bills and fail whith a 500 error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
