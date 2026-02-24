import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import fc from 'fast-check';
import { GlassCard } from './GlassCard';

describe('GlassCard Component', () => {
  // ========================================
  // UNIT TESTS
  // ========================================

  describe('Unit Tests', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <GlassCard>Test Content</GlassCard>
      );
      expect(getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply medium intensity by default', () => {
      const { container } = render(<GlassCard>Content</GlassCard>);
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('glass-card--medium');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <GlassCard className="custom-class">Content</GlassCard>
      );
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('custom-class');
    });

    it('should handle click events', () => {
      const handleClick = vi.fn();
      const { container } = render(
        <GlassCard onClick={handleClick}>Click me</GlassCard>
      );
      
      fireEvent.click(container.firstChild!);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible when clickable', () => {
      const handleClick = vi.fn();
      const { container } = render(
        <GlassCard onClick={handleClick}>Press me</GlassCard>
      );
      
      const element = container.firstChild as HTMLElement;
      
      // Test Enter key
      fireEvent.keyDown(element, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      // Test Space key
      fireEvent.keyDown(element, { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('should have role="button" when clickable', () => {
      const { container } = render(
        <GlassCard onClick={() => {}}>Clickable</GlassCard>
      );
      const element = container.firstChild as HTMLElement;
      expect(element.getAttribute('role')).toBe('button');
    });

    it('should not have role="button" when not clickable', () => {
      const { container } = render(
        <GlassCard>Not clickable</GlassCard>
      );
      const element = container.firstChild as HTMLElement;
      expect(element.getAttribute('role')).toBeNull();
    });

    it('should apply hoverable class by default', () => {
      const { container } = render(<GlassCard>Content</GlassCard>);
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('glass-card--hoverable');
    });

    it('should not apply hoverable class when hover is false', () => {
      const { container } = render(
        <GlassCard hover={false}>Content</GlassCard>
      );
      const element = container.firstChild as HTMLElement;
      expect(element.className).not.toContain('glass-card--hoverable');
    });
  });

  // ========================================
  // PROPERTY-BASED TESTS
  // ========================================

  describe('Property-Based Tests', () => {
    /**
     * **Validates: Requirements 1.1**
     * 
     * Feature: modern-glassmorphism-ui, Property 1: Glass Blur Minimum Values
     * 
     * For any glass surface component (GlassCard), the correct intensity class
     * should be applied which corresponds to the appropriate blur level.
     * 
     * Note: This test validates the class application since jsdom doesn't compute
     * CSS styles. The actual blur values are validated through the CSS definitions.
     */
    it('Property 1: should apply correct intensity class for blur levels', () => {
      fc.assert(
        fc.property(
          fc.record({
            intensity: fc.constantFrom('subtle', 'medium', 'strong'),
            children: fc.string(),
          }),
          (props) => {
            const { container } = render(
              <GlassCard intensity={props.intensity}>
                {props.children}
              </GlassCard>
            );
            
            const element = container.firstChild as HTMLElement;
            
            // Verify the correct intensity class is applied
            // This ensures the CSS rules with appropriate blur values will be applied
            expect(element.className).toContain(`glass-card--${props.intensity}`);
            
            // Verify the base glass-card class is present
            expect(element.className).toContain('glass-card');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Validates: Requirements 1.2**
     * 
     * Feature: modern-glassmorphism-ui, Property 3: Multi-Stop Gradients
     * 
     * For any glass surface component, the correct intensity class should be applied
     * which corresponds to CSS rules with multi-stop gradients (3+ color stops).
     * 
     * Note: This test validates the class application since jsdom doesn't compute
     * CSS styles. The actual gradient definitions with 3+ stops are in the CSS.
     */
    it('Property 3: should apply classes that define multi-stop gradients', () => {
      fc.assert(
        fc.property(
          fc.record({
            intensity: fc.constantFrom('subtle', 'medium', 'strong'),
          }),
          (props) => {
            const { container } = render(
              <GlassCard intensity={props.intensity}>Content</GlassCard>
            );
            
            const element = container.firstChild as HTMLElement;
            
            // Verify the correct intensity class is applied
            // Each intensity class in CSS defines a gradient with 3 color stops
            expect(element.className).toContain(`glass-card--${props.intensity}`);
            
            // Verify base class is present
            expect(element.className).toContain('glass-card');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Validates: Requirements 1.5**
     * 
     * Feature: modern-glassmorphism-ui, Property 5: Background Opacity Range
     * 
     * For any glass surface component, the correct intensity class should be applied
     * which corresponds to CSS rules with appropriate opacity values (0.05-0.15).
     * 
     * Note: This test validates the class application since jsdom doesn't compute
     * CSS styles. The actual opacity values are defined in the CSS rules.
     */
    it('Property 5: should apply classes with appropriate opacity ranges', () => {
      fc.assert(
        fc.property(
          fc.record({
            intensity: fc.constantFrom('subtle', 'medium', 'strong'),
          }),
          (props) => {
            const { container } = render(
              <div data-theme="dark">
                <GlassCard intensity={props.intensity}>Content</GlassCard>
              </div>
            );
            
            const element = container.querySelector('.glass-card') as HTMLElement;
            
            // Verify the correct intensity class is applied
            // Each intensity class in CSS uses opacity values in the 0.05-0.18 range
            expect(element.className).toContain(`glass-card--${props.intensity}`);
            
            // Verify base class is present
            expect(element.className).toContain('glass-card');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Additional property test: Intensity levels should apply correct classes
     */
    it('should apply correct intensity class for all intensity levels', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('subtle', 'medium', 'strong'),
          (intensity) => {
            const { container } = render(
              <GlassCard intensity={intensity}>Content</GlassCard>
            );
            
            const element = container.firstChild as HTMLElement;
            expect(element.className).toContain(`glass-card--${intensity}`);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Additional property test: Hover prop should control hoverable class
     */
    it('should correctly apply hoverable class based on hover prop', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (hover) => {
            const { container } = render(
              <GlassCard hover={hover}>Content</GlassCard>
            );
            
            const element = container.firstChild as HTMLElement;
            const hasHoverableClass = element.className.includes('glass-card--hoverable');
            
            expect(hasHoverableClass).toBe(hover);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    /**
     * Additional property test: onClick should make card clickable
     */
    it('should apply clickable class when onClick is provided', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (hasOnClick) => {
            const onClick = hasOnClick ? vi.fn() : undefined;
            const { container } = render(
              <GlassCard onClick={onClick}>Content</GlassCard>
            );
            
            const element = container.firstChild as HTMLElement;
            const hasClickableClass = element.className.includes('glass-card--clickable');
            
            expect(hasClickableClass).toBe(hasOnClick);
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
