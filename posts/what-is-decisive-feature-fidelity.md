Modern simulators and generative models can produce images that look strikingly real. So a natural assumption follows: if synthetic data looks real enough, a model trained or tested on it should behave as if it were real. That assumption is where a lot of safety arguments quietly break.

## Pixel realism is not the same as decision realism

Recent work keeps finding the same thing: **pixel-level fidelity alone does not guarantee reliable transfer from simulation to the real world.** Two images can be nearly indistinguishable to us, and to standard similarity metrics, while a downstream model reacts to them very differently.

The reason is that a model does not "see" the whole image equally. It leans on a subset of features to make each decision. If synthetic data reproduces the overall look but distorts *those* features, your evaluation is measuring the wrong thing.

## Decisive Feature Fidelity (DFF)

**DFF** is the metric we introduced to close that gap. Instead of comparing images in the abstract, it compares them *through the eyes of the system under test (SUT)*:

1. Take matched real and synthetic pairs.
2. Use explainable-AI methods to identify the **decisive features** driving the SUT's output on each.
3. Measure whether those features — the actual evidence behind the decision — agree.

We call that agreement **mechanism parity**: not "do these look alike?" but "does the model decide for the same reasons?"

## How it was validated

We evaluated DFF on **2,126 matched real–synthetic frame pairs** from KITTI and Virtual KITTI 2, across two very different automotive tasks:

- a **PilotNet-style steering regressor**, and
- a **YOLOP segmentation head**.

| Question | Pixel metrics | DFF |
| --- | --- | --- |
| Does it look real? | Yes | Not the point |
| Does the model decide for the same reasons? | Unknown | Measured |

## Why it matters for Safe AI

If we want to justify using simulation to test an autonomous system, we need evidence that the simulation exercises the same decision mechanisms the real world would. DFF is a step toward making that argument *measurable* rather than assumed.

The full paper is on [arXiv](https://arxiv.org/abs/2512.16468), and the reference implementation is [on GitHub](https://github.com/Danial-Safaei/DFF).
