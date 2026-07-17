function createInvalidResult(nic, message) {
  return {
    nic: nic || "",
    isValid: false,
    format: null,
    dateOfBirth: null,
    age: null,
    gender: null,
    errorMessage: message,
  };
}

/*
 * Old NIC numbers contain only the final two digits
 * of a 1900s birth year.
 *
 * Examples:
 * 99 → 1999
 * 88 → 1988
 * 05 → 1905
 */
function getOldNicBirthYear(twoDigitYear) {
  return 1900 + twoDigitYear;
}

function isLeapYear(year) {
  return (
    year % 400 === 0 ||
    (year % 4 === 0 && year % 100 !== 0)
  );
}

/*
 * Project NIC date convention:
 *
 * The expected result is one day earlier than the
 * normal JavaScript 1-based day-of-year result.
 *
 * Example:
 * 1999, code 138 → 1999-05-17
 *
 * JavaScript's Date.UTC(year, 0, 138) would return
 * 1999-05-18, so we use dayNumber - 1.
 */
function dayNumberToDate(year, dayNumber) {
  const maximumDay = isLeapYear(year) ? 366 : 365;

  if (
    !Number.isInteger(dayNumber) ||
    dayNumber < 2 ||
    dayNumber > maximumDay
  ) {
    return null;
  }

  const adjustedDayNumber = dayNumber - 1;

  const date = new Date(
    Date.UTC(year, 0, adjustedDayNumber)
  );

  if (date.getUTCFullYear() !== year) {
    return null;
  }

  return date;
}

function calculateAge(dateOfBirth) {
  const today = new Date();

  let age =
    today.getUTCFullYear() -
    dateOfBirth.getUTCFullYear();

  const birthdayNotReached =
    today.getUTCMonth() <
      dateOfBirth.getUTCMonth() ||
    (
      today.getUTCMonth() ===
        dateOfBirth.getUTCMonth() &&
      today.getUTCDate() <
        dateOfBirth.getUTCDate()
    );

  if (birthdayNotReached) {
    age -= 1;
  }

  return age;
}

function validateNic(rawNic) {
  const nic = String(rawNic || "")
    .trim()
    .toUpperCase();

  if (!nic) {
    return createInvalidResult(
      nic,
      "NIC number is empty."
    );
  }

  let format;
  let birthYear;
  let encodedDay;

  /*
   * Old NIC:
   * Nine digits followed by V or X.
   *
   * Example: 991381562V
   */
  if (/^\d{9}[VX]$/.test(nic)) {
    format = "OLD";

    const twoDigitYear = Number(
      nic.substring(0, 2)
    );

    birthYear =
      getOldNicBirthYear(twoDigitYear);

    encodedDay = Number(
      nic.substring(2, 5)
    );
  }

  /*
   * New NIC:
   * Exactly 12 digits.
   *
   * Example: 199913801562
   */
  else if (/^\d{12}$/.test(nic)) {
    format = "NEW";

    birthYear = Number(
      nic.substring(0, 4)
    );

    encodedDay = Number(
      nic.substring(4, 7)
    );
  } else {
    return createInvalidResult(
      nic,
      "NIC must contain 12 digits or 9 digits followed by V/X."
    );
  }

  const currentYear =
    new Date().getUTCFullYear();

  if (
    birthYear < 1900 ||
    birthYear > currentYear
  ) {
    return createInvalidResult(
      nic,
      "NIC contains an invalid birth year."
    );
  }

  let gender;
  let dayNumber;

  /*
   * Female:
   * 500 is added to the birthday code.
   *
   * Example:
   * 567 - 500 = day 67
   */
  if (
    encodedDay >= 502 &&
    encodedDay <= 866
  ) {
    gender = "Female";
    dayNumber = encodedDay - 500;
  }

  /*
   * Male:
   * Birthday code is used directly.
   */
  else if (
    encodedDay >= 2 &&
    encodedDay <= 366
  ) {
    gender = "Male";
    dayNumber = encodedDay;
  } else {
    return createInvalidResult(
      nic,
      "NIC contains an invalid birthday code."
    );
  }

  const dateOfBirth = dayNumberToDate(
    birthYear,
    dayNumber
  );

  if (!dateOfBirth) {
    return createInvalidResult(
      nic,
      "The birthday code is invalid for the birth year."
    );
  }

  if (dateOfBirth > new Date()) {
    return createInvalidResult(
      nic,
      "The calculated birthday is in the future."
    );
  }

  return {
    nic,
    isValid: true,
    format,
    dateOfBirth: dateOfBirth
      .toISOString()
      .substring(0, 10),
    age: calculateAge(dateOfBirth),
    gender,
    errorMessage: null,
  };
}

module.exports = {
  validateNic,
};