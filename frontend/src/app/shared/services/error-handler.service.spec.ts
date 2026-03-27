import { describe, expect, it } from 'bun:test';
import { ErrorHandlerService } from './error-handler.service';

describe('ErrorHandlerService', () => {
  it('should be created', () => {
    const service = new ErrorHandlerService();
    expect(service).toBeTruthy();
  });

  it('should handle errors', () => {
    const service = new ErrorHandlerService();
    const error = new Error('Test error');
    service.handleError(error);
    expect(service.getErrorCount()).toBe(1);
  });

  it('should get errors', () => {
    const service = new ErrorHandlerService();
    service.handleError(new Error('Error 1'));
    service.handleError(new Error('Error 2'));

    const errors = service.getErrors();
    expect(errors.length).toBe(2);
    expect(errors[0].message).toBe('Error 1');
    expect(errors[1].message).toBe('Error 2');
  });

  it('should get error count', () => {
    const service = new ErrorHandlerService();
    expect(service.getErrorCount()).toBe(0);

    service.handleError(new Error('Test'));
    expect(service.getErrorCount()).toBe(1);

    service.handleError(new Error('Test 2'));
    expect(service.getErrorCount()).toBe(2);
  });

  it('should clear errors', () => {
    const service = new ErrorHandlerService();
    service.handleError(new Error('Error 1'));
    service.handleError(new Error('Error 2'));
    service.clearErrors();
    expect(service.getErrorCount()).toBe(0);
  });

  it('should log warnings', () => {
    const service = new ErrorHandlerService();
    service.warn('Test warning', { component: 'TestComponent' });
    const errors = service.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].type).toBe('warning');
    expect(errors[0].message).toBe('Test warning');
  });

  it('should log info', () => {
    const service = new ErrorHandlerService();
    service.info('Test info', { feature: 'test' });
    const errors = service.getErrors();
    expect(errors.length).toBe(1);
    expect(errors[0].type).toBe('info');
    expect(errors[0].message).toBe('Test info');
  });

  it('should include timestamp in errors', () => {
    const service = new ErrorHandlerService();
    const before = new Date();
    service.handleError(new Error('Test'));
    const after = new Date();

    const errors = service.getErrors();
    expect(errors[0].timestamp).toBeDefined();
    expect(errors[0].timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(errors[0].timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should limit errors to 50', () => {
    const service = new ErrorHandlerService();
    for (let i = 0; i < 60; i++) {
      service.handleError(new Error(`Error ${i}`));
    }
    expect(service.getErrors().length).toBeLessThanOrEqual(50);
  });

  it('should categorize error types correctly', () => {
    const service = new ErrorHandlerService();
    service.handleError(new Error('Error'));
    service.warn('Warning');
    service.info('Info');

    const errors = service.getErrors();
    expect(errors[0].type).toBe('error');
    expect(errors[1].type).toBe('warning');
    expect(errors[2].type).toBe('info');
  });
});
