/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { screen, waitFor } from "@testing-library/dom";
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

    test("Then the NewBill page displays a title and a form", async () => {
      const nf = screen.getAllByText("Envoyer une note de frais");
      expect(nf).toBeTruthy();
      await waitFor(() => screen.getByTestId("form-new-bill"));
      const newBillIcon = screen.getByTestId("form-new-bill");
      expect(newBillIcon).toBeTruthy();
    });

    test("Then the form displays a field for expense type which is required", async () => {
      await waitFor(() => screen.getByTestId("expense-type"));
      const expenseType = screen.getByTestId("expense-type");
      expect(expenseType).toBeTruthy();
      expect(expenseType.hasAttribute("required")).toBe(true);
    });

    test("Then the form displays a field for expense name which is optional", async () => {
      await waitFor(() => screen.getByTestId("expense-name"));
      const expenseName = screen.getByTestId("expense-name");
      expect(expenseName).toBeTruthy();
      expect(expenseName.hasAttribute("required")).toBe(false);
    });

    test("Then the form displays a datepicker input which is required", async () => {
      await waitFor(() => screen.getByTestId("datepicker"));
      const datePicker = screen.getByTestId("datepicker");
      expect(datePicker).toBeTruthy();
      expect(datePicker.hasAttribute("required")).toBe(true);
    });

    test("Then the form displays a VAT amount field which is optional", async () => {
      await waitFor(() => screen.getByTestId("vat"));
      const vatAmountField = screen.getByTestId("vat");
      expect(vatAmountField).toBeTruthy();
      expect(vatAmountField.hasAttribute("required")).toBe(false);
    });

    test("Then the form displays a VAT percentage field which is required", async () => {
      await waitFor(() => screen.getByTestId("pct"));
      const vatPercentageField = screen.getByTestId("pct");
      expect(vatPercentageField).toBeTruthy();
      expect(vatPercentageField.hasAttribute("required")).toBe(true);
    });

    test("Then the form displays a comment field which is optional", async () => {
      await waitFor(() => screen.getByTestId("commentary"));
      const comments = screen.getByTestId("commentary");
      expect(comments).toBeTruthy();
      expect(comments.hasAttribute("required")).toBe(false);
    });

    test("Then the form displays a file input field which is required", async () => {
      await waitFor(() => screen.getByTestId("file"));
      const fileInput = screen.getByTestId("file");
      expect(fileInput).toBeTruthy();
      expect(fileInput.hasAttribute("required")).toBe(true);
    });
  });
});
