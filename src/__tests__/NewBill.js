/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { screen, waitFor, fireEvent } from "@testing-library/dom";
import NewBill from "../containers/NewBill.js";
import { ROUTES } from "../constants/routes";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from "@testing-library/user-event";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore);

/* ----------------------------- TESTS D'INTÉGRATION DE LA PAGE NEWBILL ----------------------------- */

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
    beforeEach(() => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
    });

    afterEach(() => {
      document.body.innerHTML = "";
    });

    test("Then the New Bill icon in vertical layout should be highlighted", () => {
      expect(screen.getByTestId("icon-mail")).toHaveClass("active-icon");
      expect(screen.getByTestId("icon-window")).not.toHaveClass("active-icon");
    });

    test("Then the NewBill page should display a title and a form", () => {
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy();
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
    });

    // ----------- Vérification des champs du formulaire

    test("Then the form should have a field for expense type which would be required", () => {
      const expenseType = screen.getByTestId("expense-type");
      expect(expenseType).toBeTruthy();
      expect(expenseType.hasAttribute("required")).toBe(true);
    });

    test("Then the form should have a field for expense name which would be optional", () => {
      const expenseName = screen.getByTestId("expense-name");
      expect(expenseName).toBeTruthy();
      expect(expenseName.hasAttribute("required")).toBe(false);
    });

    test("Then the form should have a datepicker input which would be required", () => {
      const datePicker = screen.getByTestId("datepicker");
      expect(datePicker).toBeTruthy();
      expect(datePicker.hasAttribute("required")).toBe(true);
    });

    test("Then the form should have a VAT amount field which would be optional", () => {
      const vatAmountField = screen.getByTestId("vat");
      expect(vatAmountField).toBeTruthy();
      expect(vatAmountField.hasAttribute("required")).toBe(false);
    });

    test("Then the form should have a VAT percentage field which would be required", () => {
      const vatPercentageField = screen.getByTestId("pct");
      expect(vatPercentageField).toBeTruthy();
      expect(vatPercentageField.hasAttribute("required")).toBe(true);
    });

    test("Then the form should have a comment field which would be optional", () => {
      const comments = screen.getByTestId("commentary");
      expect(comments).toBeTruthy();
      expect(comments.hasAttribute("required")).toBe(false);
    });

    test("Then the form should have a file input field which would be required", () => {
      const fileInput = screen.getByTestId("file");
      expect(fileInput).toBeTruthy();
      expect(fileInput.hasAttribute("required")).toBe(true);
    });

    test("Then the form should have a submit button", () => {
      const submitButton = screen.getByTestId("btn-send-bill");
      expect(submitButton).toBeTruthy();
      expect(submitButton.getAttribute("type")).toEqual("submit");
    });
  });
});

/* ----------------------------- TESTS D'INTÉGRATION POST ET PATCH ----------------------------- */

describe("Given I am connected as an employee", () => {
  // TESTS D'INTÉGRATION POST

  describe("When I upload a new file and the file is an image", () => {
    // Envoi de fichier avec la méthode POST
    it("Should send the file through API POST method", async () => {
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
      // Mock sur window.alert car non implémenté par Jest
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
      // Vérification de la propriété fileUrl de l'objet newBill :
      // En cas de succès de la méthode POST, cette propriété prend pour valeur l'url du fichier uploadé
      expect(newBill.fileUrl).not.toBe(null);
      // Vérification que l'utilisateur se trouve toujours sur la page NewBill
      const message = screen.getByText("Envoyer une note de frais");
      expect(message).toBeTruthy();
    });
  });

  describe("When an error occurs on API using POST method", () => {
    beforeEach(() => {
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
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
    });

    afterEach(() => {
      document.body.innerHTML = "";
    });

    it("Should send file with API POST method and fail with 404 error message", async () => {
      // Mock de la méthode bills du mockstore
      const spy = jest.spyOn(mockStore, "bills");
      // Mock de console.error
      const errorSpy = jest.spyOn(console, "error");
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("POST method - Erreur 404"));
          },
        };
      });
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
      const launchApiPost = async () => {
        fireEvent.change(fileInput, {
          target: {
            files: [file],
          },
        });
      };
      await waitFor(() => launchApiPost());
      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith("POST method - Erreur 404");
      // Restauration des mocks pour les tests suivants
      spy.mockRestore();
      errorSpy.mockRestore();
    });

    it("Should send file with API POST method and fail with 500  error message", async () => {
      const spy = jest.spyOn(mockStore, "bills");
      const errorSpy = jest.spyOn(console, "error");
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: () => {
            return Promise.reject(new Error("POST method - Erreur 500"));
          },
        };
      });
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
      const launchApiPost = async () => {
        fireEvent.change(fileInput, {
          target: {
            files: [file],
          },
        });
      };
      await waitFor(() => launchApiPost());
      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith("POST method - Erreur 500");
      spy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  // TESTS D'INTÉGRATION PATCH

  describe("When I have filled all the required inputs and I click on the submit button", () => {
    // Envoi du formulaire avec la méthode PATCH
    test("Then I should be redirected to Bills page", async () => {
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
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
      const submitButton = document.querySelector(
        `button[data-testid="btn-send-bill"]`
      );
      const form = document.querySelector(`form[data-testid="form-new-bill"]`);
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener("submit", handleSubmit);
      submitButton.addEventListener("click", () => fireEvent.submit(form));
      userEvent.click(submitButton);
      expect(handleSubmit).toHaveBeenCalled();
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const billsTitle = screen.getByText("Mes notes de frais");
      expect(billsTitle).toBeTruthy();
      document.body.innerHTML = "";
    });

    describe("When an error occurs on API using PATCH method", () => {
      beforeEach(() => {
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
      afterEach(() => {
        document.body.innerHTML = "";
      });

      it("Should submit form with API PATCH method and fail with 404 error message", async () => {
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
        window.onNavigate(ROUTES_PATH.NewBill);
        const spy = jest.spyOn(mockStore, "bills");
        const errorSpy = jest.spyOn(console, "error");
        mockStore.bills.mockImplementationOnce(() => {
          return {
            update: () => {
              return Promise.reject(new Error("PATCH method - Erreur 404"));
            },
          };
        });
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
        const submitButton = document.querySelector(
          `button[data-testid="btn-send-bill"]`
        );
        const form = document.querySelector(
          `form[data-testid="form-new-bill"]`
        );
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);
        submitButton.addEventListener("click", () => fireEvent.submit(form));
        await waitFor(async () => userEvent.click(submitButton));
        expect(errorSpy).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith("PATCH method - Erreur 404");
        spy.mockRestore();
        errorSpy.mockRestore();
      });

      it("Should submit form with API POST method and fail with 500 error message", async () => {
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
        window.onNavigate(ROUTES_PATH.NewBill);
        const spy = jest.spyOn(mockStore, "bills");
        const errorSpy = jest.spyOn(console, "error");
        mockStore.bills.mockImplementationOnce(() => {
          return {
            update: () => {
              return Promise.reject(new Error("PATCH method - Erreur 500"));
            },
          };
        });
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
        const submitButton = document.querySelector(
          `button[data-testid="btn-send-bill"]`
        );
        const form = document.querySelector(
          `form[data-testid="form-new-bill"]`
        );
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
        form.addEventListener("submit", handleSubmit);
        submitButton.addEventListener("click", () => fireEvent.submit(form));
        await waitFor(async () => userEvent.click(submitButton));
        expect(errorSpy).toHaveBeenCalled();
        expect(errorSpy).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith("PATCH method - Erreur 500");
        spy.mockRestore();
        errorSpy.mockRestore();
      });
    });
  });
});
