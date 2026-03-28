/**
 * Tests for GlobalErrorService
 *
 * Tests cover:
 * - Error state management
 * - Error setting from ErrorValue
 * - Error clearing
 * - Signal exposure
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { GlobalErrorService } from './global-error.service';
import { ErrorCode } from '../types';

describe('GlobalErrorService', () => {
  let service: GlobalErrorService;

  beforeEach(() => {
    service = new GlobalErrorService();
  });

  describe('Initial State', () => {
    test('should start with no error', () => {
      const error = service.currentError();
      expect(error).toBeNull();
    });
  });

  describe('setError', () => {
    test('should set error state', () => {
      const errorState = {
        title: 'Test Error',
        userMessage: 'Something went wrong',
        error: {
          code: ErrorCode.InternalError,
          message: 'Internal error occurred',
          field: null,
          context: null,
          details: null,
          cause: null,
        } as any,
        source: 'TestComponent',
        timestamp: Date.now(),
      };

      service.setError(errorState);

      const currentError = service.currentError();
      expect(currentError).toEqual(errorState);
    });

    test('should update error state', () => {
      const firstError = {
        title: 'First Error',
        userMessage: 'First message',
        error: {
          code: ErrorCode.InternalError,
          message: 'First',
          field: null,
          context: null,
          details: null,
          cause: null,
        } as any,
        timestamp: Date.now(),
      };

      const secondError = {
        title: 'Second Error',
        userMessage: 'Second message',
        error: {
          code: ErrorCode.ValidationFailed,
          message: 'Second',
          field: 'email',
          context: null,
          details: null,
          cause: null,
        } as any,
        timestamp: Date.now(),
      };

      service.setError(firstError);
      expect(service.currentError()?.title).toBe('First Error');

      service.setError(secondError);
      expect(service.currentError()?.title).toBe('Second Error');
    });

    test('should handle error without source', () => {
      const errorState = {
        title: 'No Source Error',
        userMessage: 'Error without source',
        error: {
          code: ErrorCode.Unknown,
          message: 'Unknown error',
          field: null,
          context: null,
          details: null,
          cause: null,
        } as any,
        timestamp: Date.now(),
      };

      service.setError(errorState);

      const currentError = service.currentError();
      expect(currentError?.source).toBeUndefined();
      expect(currentError?.title).toBe('No Source Error');
    });
  });

  describe('setErrorFromErrorValue', () => {
    test('should create error state from ErrorValue', () => {
      const errorValue = {
        code: ErrorCode.DbConnectionFailed,
        message: 'Database connection failed',
        field: 'connection_string',
        context: { database: 'postgres' },
        details: 'Connection refused',
        cause: 'Network error',
      };

      service.setErrorFromErrorValue(errorValue);

      const currentError = service.currentError();
      expect(currentError?.title).toBe('Error');
      expect(currentError?.userMessage).toBe('Database connection failed');
      expect(currentError?.error).toEqual(errorValue);
      expect(currentError?.timestamp).toBeGreaterThan(0);
    });

    test('should use custom title', () => {
      const errorValue = {
        code: ErrorCode.AuthTokenExpired,
        message: 'Token has expired',
        field: null,
        context: null,
        details: null,
        cause: null,
      };

      service.setErrorFromErrorValue(errorValue, 'Authentication Error');

      const currentError = service.currentError();
      expect(currentError?.title).toBe('Authentication Error');
    });

    test('should default to "Error" title', () => {
      const errorValue = {
        code: ErrorCode.Unknown,
        message: 'Something happened',
        field: null,
        context: null,
        details: null,
        cause: null,
      };

      service.setErrorFromErrorValue(errorValue);

      const currentError = service.currentError();
      expect(currentError?.title).toBe('Error');
    });

    test('should set timestamp automatically', () => {
      const before = Date.now();
      
      const errorValue = {
        code: ErrorCode.InternalError,
        message: 'Test',
        field: null,
        context: null,
        details: null,
        cause: null,
      };

      service.setErrorFromErrorValue(errorValue);

      const after = Date.now();
      const currentError = service.currentError();
      
      expect(currentError?.timestamp).toBeGreaterThanOrEqual(before);
      expect(currentError?.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('clearError', () => {
    test('should clear error state', () => {
      const errorState = {
        title: 'To Clear',
        userMessage: 'This will be cleared',
        error: {
          code: ErrorCode.InternalError,
          message: 'Test',
          field: null,
          context: null,
          details: null,
          cause: null,
        } as any,
        timestamp: Date.now(),
      };

      service.setError(errorState);
      expect(service.currentError()).toBeDefined();

      service.clearError();
      expect(service.currentError()).toBeNull();
    });

    test('should handle clearing when no error', () => {
      // Should not throw
      service.clearError();
      expect(service.currentError()).toBeNull();
    });

    test('should allow setting new error after clear', () => {
      service.setError({
        title: 'First',
        userMessage: 'First',
        error: {
          code: ErrorCode.InternalError,
          message: 'First',
          field: null,
          context: null,
          details: null,
          cause: null,
        } as any,
        timestamp: Date.now(),
      });

      service.clearError();

      service.setError({
        title: 'Second',
        userMessage: 'Second',
        error: {
          code: ErrorCode.ValidationFailed,
          message: 'Second',
          field: null,
          context: null,
          details: null,
          cause: null,
        } as any,
        timestamp: Date.now(),
      });

      expect(service.currentError()?.title).toBe('Second');
    });
  });

  describe('Signal Exposure', () => {
    test('should expose currentError as readonly signal', () => {
      const signal = service.currentError;
      expect(typeof signal).toBe('function');
      
      // Should return current value when called
      const value = signal();
      expect(value).toBeNull();
    });

    test('should update signal on error change', () => {
      expect(service.currentError()).toBeNull();

      service.setError({
        title: 'Signal Test',
        userMessage: 'Testing signals',
        error: {
          code: ErrorCode.InternalError,
          message: 'Test',
          field: null,
          context: null,
          details: null,
          cause: null,
        } as any,
        timestamp: Date.now(),
      });

      expect(service.currentError()?.title).toBe('Signal Test');
    });
  });

  describe('Error State Structure', () => {
    test('should preserve all error properties', () => {
      const errorState = {
        title: 'Complete Error',
        userMessage: 'Complete message',
        error: {
          code: ErrorCode.DbConstraintViolation,
          message: 'Constraint violated',
          field: 'email',
          context: { table: 'users', constraint: 'unique_email' },
          details: 'SQL: INSERT INTO users...',
          cause: 'Duplicate entry',
        } as any,
        source: 'UserForm',
        timestamp: 1234567890,
      };

      service.setError(errorState);

      const current = service.currentError();
      expect(current?.title).toBe('Complete Error');
      expect(current?.userMessage).toBe('Complete message');
      expect(current?.error.code).toBe(ErrorCode.DbConstraintViolation);
      expect(current?.error.field).toBe('email');
      expect(current?.error.context).toEqual({ table: 'users', constraint: 'unique_email' });
      expect(current?.error.details).toBe('SQL: INSERT INTO users...');
      expect(current?.error.cause).toBe('Duplicate entry');
      expect(current?.source).toBe('UserForm');
      expect(current?.timestamp).toBe(1234567890);
    });

    test('should handle null/undefined error properties', () => {
      const errorState = {
        title: 'Minimal Error',
        userMessage: 'Minimal',
        error: {
          code: ErrorCode.Unknown,
          message: 'Unknown',
          field: null,
          context: null,
          details: null,
          cause: null,
        } as any,
        timestamp: Date.now(),
      };

      service.setError(errorState);

      const current = service.currentError();
      expect(current?.error.field).toBeNull();
      expect(current?.error.context).toBeNull();
      expect(current?.error.details).toBeNull();
      expect(current?.error.cause).toBeNull();
    });
  });

  describe('Multiple Error Codes', () => {
    const errorCodes = [
      ErrorCode.ValidationFailed,
      ErrorCode.ResourceNotFound,
      ErrorCode.UserNotFound,
      ErrorCode.EntityNotFound,
      ErrorCode.DbAlreadyExists,
      ErrorCode.DbConnectionFailed,
      ErrorCode.DbQueryFailed,
      ErrorCode.DbConstraintViolation,
      ErrorCode.ConfigNotFound,
      ErrorCode.ConfigInvalid,
      ErrorCode.ConfigMissingField,
      ErrorCode.SerializationFailed,
      ErrorCode.DeserializationFailed,
      ErrorCode.InvalidFormat,
      ErrorCode.InternalError,
      ErrorCode.LockPoisoned,
      ErrorCode.Unknown,
    ];

    test.each(errorCodes)('should handle error with code %s', (code) => {
      const errorValue = {
        code,
        message: `Error with code ${code}`,
        field: null,
        context: null,
        details: null,
        cause: null,
      };

      service.setErrorFromErrorValue(errorValue);

      const current = service.currentError();
      expect(current?.error.code).toBe(code);
      expect(current?.userMessage).toBe(`Error with code ${code}`);
    });
  });

  describe('Integration Scenarios', () => {
    test('should handle rapid error changes', () => {
      for (let i = 0; i < 10; i++) {
        service.setError({
          title: `Error ${i}`,
          userMessage: `Message ${i}`,
          error: {
            code: ErrorCode.InternalError,
            message: `Error ${i}`,
            field: null,
            context: null,
            details: null,
            cause: null,
          } as any,
          timestamp: Date.now(),
        });
      }

      expect(service.currentError()?.title).toBe('Error 9');
    });

    test('should handle error-clear-error cycle', () => {
      service.setError({
        title: 'First',
        userMessage: 'First',
        error: {
          code: ErrorCode.InternalError,
          message: 'First',
          field: null,
          context: null,
          details: null,
          cause: null,
        } as any,
        timestamp: Date.now(),
      });

      service.clearError();

      service.setError({
        title: 'Second',
        userMessage: 'Second',
        error: {
          code: ErrorCode.ValidationFailed,
          message: 'Second',
          field: null,
          context: null,
          details: null,
          cause: null,
        } as any,
        timestamp: Date.now(),
      });

      service.clearError();

      expect(service.currentError()).toBeNull();
    });

    test('should preserve error after multiple reads', () => {
      const errorState = {
        title: 'Persistent Error',
        userMessage: 'Should persist',
        error: {
          code: ErrorCode.InternalError,
          message: 'Persistent',
          field: null,
          context: null,
          details: null,
          cause: null,
        } as any,
        timestamp: Date.now(),
      };

      service.setError(errorState);

      // Read multiple times
      for (let i = 0; i < 5; i++) {
        const current = service.currentError();
        expect(current?.title).toBe('Persistent Error');
      }

      // Should still be there
      expect(service.currentError()?.title).toBe('Persistent Error');
    });
  });
});
