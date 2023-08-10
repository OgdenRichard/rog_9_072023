/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { screen, waitFor, fireEvent, user, upload } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES } from "../constants/routes";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store";
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
        email: "test@test.test",
      })
    );
  });

  describe("When I am on NewBill Page", () => {
    beforeAll(() => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
    });

    test("Then the New Bill icon in vertical layout should be highlighted", async () => {
      await waitFor(() => screen.getByTestId("icon-mail"));
      const newBillIcon = screen.getByTestId("icon-mail");
      expect(newBillIcon).toHaveClass("active-icon");
      await waitFor(() => screen.getByTestId("icon-window"));
      const billsIcon = screen.getByTestId("icon-window");
      expect(billsIcon).not.toHaveClass("active-icon");
    });

    test("Then the NewBill page should display a title and a form", async () => {
      const nf = screen.getAllByText("Envoyer une note de frais");
      expect(nf).toBeTruthy();
      await waitFor(() => screen.getByTestId("form-new-bill"));
      const newBillIcon = screen.getByTestId("form-new-bill");
      expect(newBillIcon).toBeTruthy();
    });

    test("Then the form should have a field for expense type which would be required", async () => {
      await waitFor(() => screen.getByTestId("expense-type"));
      const expenseType = screen.getByTestId("expense-type");
      expect(expenseType).toBeTruthy();
      expect(expenseType.hasAttribute("required")).toBe(true);
    });

    test("Then the form should have a field for expense name which would be optional", async () => {
      await waitFor(() => screen.getByTestId("expense-name"));
      const expenseName = screen.getByTestId("expense-name");
      expect(expenseName).toBeTruthy();
      expect(expenseName.hasAttribute("required")).toBe(false);
    });

    test("Then the form should have a datepicker input which would be required", async () => {
      await waitFor(() => screen.getByTestId("datepicker"));
      const datePicker = screen.getByTestId("datepicker");
      expect(datePicker).toBeTruthy();
      expect(datePicker.hasAttribute("required")).toBe(true);
    });

    test("Then the form should have a VAT amount field which would be optional", async () => {
      await waitFor(() => screen.getByTestId("vat"));
      const vatAmountField = screen.getByTestId("vat");
      expect(vatAmountField).toBeTruthy();
      expect(vatAmountField.hasAttribute("required")).toBe(false);
    });

    test("Then the form should have a VAT percentage field which would be required", async () => {
      await waitFor(() => screen.getByTestId("pct"));
      const vatPercentageField = screen.getByTestId("pct");
      expect(vatPercentageField).toBeTruthy();
      expect(vatPercentageField.hasAttribute("required")).toBe(true);
    });

    test("Then the form should have a comment field which would be optional", async () => {
      await waitFor(() => screen.getByTestId("commentary"));
      const comments = screen.getByTestId("commentary");
      expect(comments).toBeTruthy();
      expect(comments.hasAttribute("required")).toBe(false);
    });

    test("Then the form should have a file input field which would be required", async () => {
      await waitFor(() => screen.getByTestId("file"));
      const fileInput = screen.getByTestId("file");
      expect(fileInput).toBeTruthy();
      expect(fileInput.hasAttribute("required")).toBe(true);
    });

    test("Then the form should have a submit button", async () => {
      await waitFor(() => screen.getByTestId("btn-send-bill"));
      const submitButton = screen.getByTestId("btn-send-bill");
      expect(submitButton).toBeTruthy();
      expect(submitButton.getAttribute("type")).toEqual("submit");
    });

    describe("When I have filled all the required inputs and I click on the submit button", () => {
      test("Then I should be redirected to Bills page", () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const store = null;
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });
        jest.spyOn(newBill, "updateBill").mockImplementationOnce(() => {});
        const submitButton = document.querySelector(
          `button[data-testid="btn-send-bill"]`
        );
        const form = document.querySelector(
          `form[data-testid="form-new-bill"]`
        );
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);
        submitButton.addEventListener("click", () => fireEvent.submit(form));
        userEvent.click(submitButton);
        expect(handleSubmit).toHaveBeenCalled();
        expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
      });
    });

    describe("When I add a new file in input file", () => {
      it("Should resolve a promise whith an object containing fileUrl and key properties", async () => {
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.append(root);
        router();
        window.onNavigate(ROUTES_PATH.NewBill);
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const store = mockStore;
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage: window.localStorage,
        });
        window.alert = jest.fn();
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
        const file = new File(["hello"], "hello.png", { type: "image/png" });
        const fileInput = document.querySelector(`input[data-testid="file"]`);
        fileInput.addEventListener("change", handleChangeFile);
        await waitFor(() => {
          fireEvent.change(fileInput, {
            target: {
              files: [file],
            },
          });
        });
        expect(newBill.fileUrl).not.toBe(null);
      });
    });
  });
});
