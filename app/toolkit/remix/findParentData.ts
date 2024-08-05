type ParentDataSelector = <T>(data: any) => T;

/** Useful inside a Meta function */
export const findParentData = <T>(
  parentData: { [routeKey: string]: any },
  selector: ParentDataSelector
) => {
  let match = Object.values(parentData)
    .reverse()
    .filter(Boolean)
    .find((data) => selector(data));

  return selector(match) as T;
};
