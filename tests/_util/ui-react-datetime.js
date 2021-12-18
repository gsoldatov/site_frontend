import { fireEvent, screen, waitFor } from "@testing-library/dom";


/**
 * Returns elements of a React-Datetime control inside provided `container`.
 * NOTE: currently only container, input and days selecting elements are returned.
 */
export const getReactDatetimeElements = container => {
    const result = {
        container: null,
        input: null,
        days: {
            prevMonth: null,
            currentMonth: null,
            nextMonth: null,
            currentMonthDays: {},
            time: null
        }
    };

    // Contaienr & input
    const rdtContainer = container.querySelector("div.rdt");
    
    if (rdtContainer) {
        result.container = rdtContainer;
        result.input = rdtContainer.querySelector("div > input.form-control");

        // Days
        const daysContainer = rdtContainer.querySelector("div.rdtDays");

        if (daysContainer) {
            result.days.prevMonth = daysContainer.querySelector("thead .rdtPrev");
            result.days.currentMonth = daysContainer.querySelector("thead .rdtSwitch");
            result.days.nextMonth = daysContainer.querySelector("thead .rdtNext");

            const currentMonthDays = new Array(...daysContainer.querySelectorAll("tbody td.rdtDay:not(.rdtOld):not(.rdtNew)"));
            for (let d of currentMonthDays) {
                const day = d.attributes["data-value"].textContent;
                result.days.currentMonthDays[day] = d;
            }
        }
    }

    return result;
};


/**
 * Searches for a React-Datetime control inside `container`, opens it, selects a provided `date` (only current month is supported now) and closes the calendar.
 */
export const selectDate = async (container, date) => {
    const now = new Date();
    if (date.getFullYear() !== now.getFullYear() || date.getMonth() !== now.getMonth()) throw Error("Selecting date in another month or year is not implemented.");

    let rdtElements = getReactDatetimeElements(container);
    if (!rdtElements.input) throw Error("RDT input not found.");

    fireEvent.click(rdtElements.input);
    rdtElements = getReactDatetimeElements(container);
    fireEvent.click(rdtElements.days.currentMonthDays[date.getDate()]);

    // Close calendar (not working)

    // fireEvent.click(container);  // Click outside of RDT container to close the calendar
    // fireEvent.blur(rdtElements.input)
    // fireEvent.keyDown(rdtElements.input, { key: "Tab", code: "Tab" });

    // for (const key in rdtElements.container) {  // Run component state updating function programmatically (state is updated, but component does not rerender)
    //     if (key.startsWith('__reactInternalInstance$')) {
    //         rdtElements.container[key].return.return.return.stateNode._closeCalendar();
    //         await waitFor(() => expect(rdtElements.container[key].return.return.return.stateNode.state.open).toEqual(false));
    //         // await waitFor(() => expect(getReactDatetimeElements(container).days.currentMonth).toBeNull());
    //         break;
    //     }
    // }
};
