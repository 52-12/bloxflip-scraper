const usernameTooLong = (username: string): boolean => {
  return username.length > 20;
};

const usernameTooShort = (username: string): boolean => {
  return username.length < 3;
};

const usernameStartsOrEndsWithUnderscore = (username: string): boolean => {
  const trimmedUsername = username.trim();
  const l = trimmedUsername.length;
  if (trimmedUsername[0] === '_' || trimmedUsername[l - 1] === '_') {
    return true;
  }
  return false;
};

const usernameHasMoreThanOneUnderscore = (username: string): boolean => {
  return username.split('_').length > 2;
};

const usernameRegexInvalid = (username: string): boolean => {
  let regexFail = username.indexOf(' ') !== -1;
  const re = /^[a-zA-Z0-9_]*$/;
  regexFail = regexFail || !re.exec(username);
  return regexFail;
};

const containsHtml = (inputText: string): boolean => {
  // this wil not catch html with leading whitespace in tag, like < a>
  // however, this is not valid html: https://www.w3.org/TR/REC-xml/#sec-starttags
  const matches = /<[a-z][\s\S]*>/i.exec(inputText);
  if (matches && matches.length > 0) {
    return true;
  }
  return false;
};

const isInvalidUsername = (username: string): boolean => {
  if (usernameTooShort(username) || usernameTooLong(username)) {
    return true
  }
  if (usernameStartsOrEndsWithUnderscore(username)) {
    return true
  }
  if (usernameHasMoreThanOneUnderscore(username)) {
    return true
  }
  if (containsHtml(username)) {
    return true
  }
  if (usernameRegexInvalid(username)) {
    return true
  }
  return false
};

export { isInvalidUsername as default };
