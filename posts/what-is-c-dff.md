[Decisive Feature Fidelity](blog.html?post=what-is-decisive-feature-fidelity) (DFF) asks whether a frozen model relies on the same visual evidence in a real image and in its synthetic twin. When the answer is no, DFF tells you *that* the evidence changed. It does not tell you *what* changed, and a mismatch between two heatmaps is hard to turn into an engineering action.

**C-DFF** (Concept-Decisive Feature Fidelity), our follow-up paper at IEEE ITSC 2026, addresses that gap by expressing the evidence in terms of scene concepts.

## From pixels to concepts

For each matched pair of a real and a synthetic image, C-DFF:

1. extracts the decisive evidence behind the model's output, using a perturbation-based counterfactual explanation;
2. segments the scene with an off-the-shelf model (Mask2Former, with the 19 Cityscapes classes such as road, sidewalk, building, car and sky);
3. averages the decisive evidence over the area of each concept, giving each image a concept-importance profile;
4. compares the real and the synthetic profile.

The result is one mechanism-parity score per pair, plus a **concept shift**: which concepts became more decisive in simulation, and which became less.

## What it found

We evaluated C-DFF on 2,126 matched KITTI / Virtual KITTI 2 pairs with three frozen systems under test: a steering regressor and YOLOP's drivable-area and lane-line heads.

- C-DFF separated the three systems on the same held-out image pairs, consistent with the view that fidelity depends on the model under test, not on the images alone.
- Reported next to output-agreement metrics, C-DFF shows that output agreement does not by itself establish that the model relies on the same evidence.
- The concept shifts were specific. **Buildings became less decisive** in simulation for all three systems, though only slightly for the lane-line head.

| System under test | More decisive in simulation | Less decisive in simulation |
| --- | --- | --- |
| Steering regressor | terrain, wall, sky | traffic sign, truck, building |
| YOLOP drivable area | car, pole, wall | building, fence, truck |
| YOLOP lane lines | wall, sky, pole | terrain, fence, traffic sign |

Each row lists the three largest average increases and decreases on the held-out split. They are dataset-level averages: they tell an engineer where to look first, not what caused the difference.

## How it is meant to be used

C-DFF works in two layers:

- a **scalar gate**: a thresholded score for screening, or for regression tests when the simulator changes;
- **concept-level checks**: a ranked list of shifted concepts for debugging, and monitoring of critical concepts such as road, lane and sidewalk.

DFF and C-DFF complement each other: DFF is the fine-grained mechanism signal, and C-DFF is the semantic layer that shows which scene concepts are involved when a synthetic sample fails.

## Limits

The concept scores are only as good as the tools underneath them. Decisive maps vary with the explanation method's settings. Segmentation errors can bias concept scores; we partly bounded this on the synthetic side, using Virtual KITTI 2's ground-truth labels for a held-out subset, but the real images have no equivalent labels. Poorly matched pairs inflate the score, counterfactual explanations are expensive to compute, and the thresholds are calibrated for one benchmark, not universal safety bounds.

## Read more

The paper will appear in the proceedings of the 2026 IEEE 29th International Conference on Intelligent Transportation Systems (ITSC), Naples, Italy. The accepted version is on [arXiv](https://arxiv.org/abs/2610.33760).
