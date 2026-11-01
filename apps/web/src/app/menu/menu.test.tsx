import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MenuContent } from './page';
afterEach(cleanup);
const retry = vi.fn();
describe('Menu component', () => {
 it('WEB-T01 renders loading skeleton', () => { render(<MenuContent products={[]} state="loading" retry={retry}/>); expect(screen.getByRole('status')).toBeTruthy(); });
 it('WEB-T02 renders empty menu', () => { render(<MenuContent products={[]} state="empty" retry={retry}/>); expect(screen.getByText('Chưa có món')).toBeTruthy(); });
 it('WEB-T03 shows error and retry button that invokes callback', () => {
  render(<MenuContent products={[]} state="error" retry={retry}/>);
  expect(screen.getByRole('alert')).toBeTruthy(); fireEvent.click(screen.getByRole('button', {name:'Thử lại'})); expect(retry).toHaveBeenCalledOnce();
 });
 it('shows sold out label', () => {
  render(<MenuContent state="ready" retry={retry} products={[{id:1,name:'Trà đào',price:45000,imageUrl:'',stock:0}]}/>);
  expect(screen.getByText('Hết hàng')).toBeTruthy();
 });
});
