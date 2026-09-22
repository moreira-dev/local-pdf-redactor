<script lang="ts">
	import { asset } from '$app/paths';
</script>

<section class="surface border-top border-bottom py-5">
	<div class="container">
		<div class="col-lg-8 mx-auto">
			<h2 class="mb-4">Example</h2>

			<div class="row g-4">
				<figure class="col-9 col-md-7 mb-0">
					<img
						class="img-fluid border"
						src={asset('/before.png')}
						alt="A sample payslip showing the employee's name, address, tax file number, email and phone number"
						width="900"
						height="900"
					/>
				</figure>

				<div class="w-100 mt-0"></div>

				<div class="col-3 col-md-5 d-flex align-items-start justify-content-end">
					<i class="bi bi-arrow-return-right arrow" aria-hidden="true"></i>
				</div>

				<figure class="col-9 col-md-7 mb-0">
					<img
						class="img-fluid border"
						src={asset('/after.png')}
						alt="The same payslip with the personal details covered by redaction boxes"
						width="900"
						height="900"
					/>
				</figure>
			</div>
		</div>
	</div>
</section>

<style>
	.arrow {
		font-size: 2.5rem;
		line-height: 1;
		transform: rotate(45deg);
	}

	@media (min-width: 768px) {
		.arrow {
			font-size: 5rem;
		}
	}
</style>
