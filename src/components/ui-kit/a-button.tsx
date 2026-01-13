import clsx from "clsx";
import React from "react";
import styles from "./button.module.css";
import { Link } from "react-router-dom";

interface Props extends React.ComponentProps<typeof Link> {}

/** An anchor tag which looks like a button. */
export function AButton(props: Props) {
  const { onClick, className, ...rest } = props;

  return (
    <Link
      {...rest}
      className={clsx(styles.button, className)}
    >
      {props.children}
    </Link>
  );
}
