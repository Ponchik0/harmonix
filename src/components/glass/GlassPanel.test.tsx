import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GlassPanel } from './GlassPanel';

describe('GlassPanel Component', () => {
  // ========================================
  // UNIT TESTS
  // ========================================

  describe('Unit Tests', () => {
    it('should render children correctly', () => {
      const { getByText } = render(
        <GlassPanel>Test Content</GlassPanel>
      );
      expect(getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <GlassPanel className="custom-class">Content</GlassPanel>
      );
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('custom-class');
    });

    it('should apply base glass-panel class', () => {
      const { container } = render(<GlassPanel>Content</GlassPanel>);
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('glass-panel');
    });

    it('should apply dynamic blur when provided', () => {
      const { container } = render(
        <GlassPanel blur={50}>Content</GlassPanel>
      );
      const element = container.firstChild as HTMLElement;
      const style = element.style;
      
      expect(style.backdropFilter).toContain('blur(50px)');
      expect(style.WebkitBackdropFilter).toContain('blur(50px)');
    });

    it('should apply dynamic opacity when provided', () => {
      const { container } = render(
        <GlassPanel opacity={0.2}>Content</GlassPanel>
      );
      const element = container.firstChild as HTMLElement;
      const style = element.style;
      
      // Check that background contains the opacity value
      expect(style.background).toContain('0.2');
    });

    it('should apply animated gradient class when gradient is true', () => {
      const { container } = render(
        <GlassPanel gradient={true}>Content</GlassPanel>
      );
      const element = container.firstChild as HTMLElement;
      expect(element.className).toContain('glass-panel--animated-gradient');
    });

    it('should not apply animated gradient class when gradient is false', () => {
      const { container } = render(
        <GlassPanel gradient={false}>Content</GlassPanel>
      );
      const element = container.firstChild as HTMLElement;
      expect(element.className).not.toContain('glass-panel--animated-gradient');
    });

    it('should not apply animated gradient class by default', () => {
      const { container } = render(
        <GlassPanel>Content</GlassPanel>
      );
      const element = container.firstChild as HTMLElement;
      expect(element.className).not.toContain('glass-panel--animated-gradient');
    });

    it('should combine dynamic blur and opacity', () => {
      const { container } = render(
        <GlassPanel blur={45} opacity={0.15}>Content</GlassPanel>
      );
      const element = container.firstChild as HTMLElement;
      const style = element.style;
      
      expect(style.backdropFilter).toContain('blur(45px)');
      expect(style.background).toContain('0.15');
    });

    it('should combine all props correctly', () => {
      const { container } = render(
        <GlassPanel 
          blur={55} 
          opacity={0.18} 
          gradient={true}
          className="test-class"
        >
          Content
        </GlassPanel>
      );
      const element = container.firstChild as HTMLElement;
      
      expect(element.className).toContain('glass-panel');
      expect(element.className).toContain('glass-panel--animated-gradient');
      expect(element.className).toContain('test-class');
      expect(element.style.backdropFilter).toContain('blur(55px)');
      expect(element.style.background).toContain('0.18');
    });

    it('should handle blur value of 0', () => {
      const { container } = render(
        <GlassPanel blur={0}>Content</GlassPanel>
      );
      const element = container.firstChild as HTMLElement;
      expect(element.style.backdropFilter).toContain('blur(0px)');
    });

    it('should handle opacity value of 0', () => {
      const { container } = render(
        <GlassPanel opacity={0}>Content</GlassPanel>
      );
      const element = container.firstChild as HTMLElement;
      expect(element.style.background).toContain('rgba(255, 255, 255, 0)');
    });

    it('should handle large blur values', () => {
      const { container } = render(
        <GlassPanel blur={100}>Content</GlassPanel>
      );
      const element = container.firstChild as HTMLElement;
      expect(element.style.backdropFilter).toContain('blur(100px)');
    });

    it('should handle opacity value of 1', () => {
      const { container } = render(
        <GlassPanel opacity={1}>Content</GlassPanel>
      );
      const element = container.firstChild as HTMLElement;
      expect(element.style.background).toContain('rgba(255, 255, 255, 1)');
    });
  });
});
