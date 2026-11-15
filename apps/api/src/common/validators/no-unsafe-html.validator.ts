import {
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

const UNSAFE_HTML_PATTERN = /<\s*\/?\s*[a-z][^>]*>|javascript\s*:|data\s*:\s*text\/html|\bon[a-z]+\s*=/i;

export function containsUnsafeHtml(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return UNSAFE_HTML_PATTERN.test(value);
}

export function NoUnsafeHtml(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'noUnsafeHtml',
      target: object.constructor,
      propertyName,
      options: {
        message: `${propertyName} chứa nội dung HTML hoặc script không hợp lệ`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          if (value === undefined || value === null) return true;
          return !containsUnsafeHtml(value);
        },
      },
    });
  };
}
