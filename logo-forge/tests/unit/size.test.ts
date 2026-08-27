import { describe, expect, it } from 'vitest';
import { fitInside, resolvePixelSize, scalePercent, unitToInches } from '@core/export/size';
import { makeAsset } from '../fixtures/settings';

const asset = makeAsset({ width: 400, height: 200 });

describe('unitToInches', () => {
  it('convertit millimetres, points et pixels', () => {
    expect(unitToInches(25.4, 'mm', 72)).toBeCloseTo(1);
    expect(unitToInches(72, 'pt', 72)).toBeCloseTo(1);
    expect(unitToInches(300, 'px', 300)).toBeCloseTo(1);
  });
});

describe('resolvePixelSize', () => {
  it('applique un facteur d echelle a 72 ppp', () => {
    expect(resolvePixelSize({ mode: 'scale', value: 2, unit: 'px' }, asset)).toEqual({
      width: 800,
      height: 400,
    });
  });

  it('tient compte de la resolution demandee', () => {
    expect(resolvePixelSize({ mode: 'scale', value: 1, unit: 'px' }, asset, 300)).toEqual({
      width: 1667,
      height: 833,
    });
  });

  it('contraint le plus grand cote quel que soit le ratio', () => {
    const portrait = makeAsset({ width: 200, height: 400 });
    expect(resolvePixelSize({ mode: 'longest-edge', value: 1000, unit: 'px' }, asset)).toEqual({
      width: 1000,
      height: 500,
    });
    expect(resolvePixelSize({ mode: 'longest-edge', value: 1000, unit: 'px' }, portrait)).toEqual({
      width: 500,
      height: 1000,
    });
  });

  it('respecte un canvas exact', () => {
    expect(
      resolvePixelSize({ mode: 'exact', value: 1500, height: 500, unit: 'px' }, asset),
    ).toEqual({ width: 1500, height: 500 });
  });

  it('ne descend jamais sous un pixel', () => {
    expect(resolvePixelSize({ mode: 'scale', value: 0.0001, unit: 'px' }, asset)).toEqual({
      width: 1,
      height: 1,
    });
  });
});

describe('scalePercent', () => {
  it('exprime l echelle en pourcentage de la taille du plan de travail', () => {
    expect(scalePercent({ width: 800, height: 400 }, asset)).toBe(200);
  });
});

describe('fitInside', () => {
  it('centre le logo dans un canvas carre en respectant la zone de securite', () => {
    const fitted = fitInside({ width: 500, height: 500 }, asset, 0.7);
    expect(fitted.width).toBe(350);
    expect(fitted.height).toBe(175);
    expect(fitted.offsetX).toBe(75);
    expect(fitted.offsetY).toBe(163);
  });

  it('contraint par la hauteur pour un logo vertical', () => {
    const portrait = makeAsset({ width: 100, height: 400 });
    const fitted = fitInside({ width: 500, height: 500 }, portrait, 1);
    expect(fitted.height).toBe(500);
    expect(fitted.width).toBe(125);
  });
});
